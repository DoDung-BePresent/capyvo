# Full Test Mode - Bug Fixes TODO

## 🔴 CRITICAL BUGS (Ưu tiên cao nhất)

### ✅ Task 1: Fix Score Calculation

**Priority:** 🔴 CRITICAL  
**Status:** ⏳ TODO  
**Issue:** Tất cả câu 2.5/3 điểm nhưng tổng chỉ 10/200 điểm

**Files to modify:**

- `server/src/services/response.service.ts` (method `generateOverallAssessment`)

**Solution:** Implement weighted scoring with curve

```typescript
// Add this function to response.service.ts
private calculateTOEICScore(partScores: Record<number, number[]>): number {
  // Part weights based on TOEIC Speaking structure
  const weights = {
    1: 0.15, // Part 1: 2 questions (Read aloud) - 15%
    2: 0.15, // Part 2: 2 questions (Describe picture) - 15%
    3: 0.25, // Part 3: 3 questions (Respond to questions) - 25%
    4: 0.25, // Part 4: 3 questions (Respond using info) - 25%
    5: 0.20, // Part 5: 1 question (Express opinion) - 20%
  }

  let weightedSum = 0
  let totalWeight = 0

  for (const [part, scores] of Object.entries(partScores)) {
    const partNum = Number(part)
    const weight = weights[partNum as keyof typeof weights] || 0
    const maxScore = partNum === 5 ? 5 : 3
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    const normalized = avgScore / maxScore // 0-1 range

    weightedSum += normalized * weight
    totalWeight += weight
  }

  const normalizedScore = weightedSum / totalWeight // 0-1

  // Apply curve (similar to TOEIC scoring)
  let scaledScore: number
  if (normalizedScore < 0.3) {
    // 0-30% → 0-40 points
    scaledScore = normalizedScore * 133
  } else if (normalizedScore < 0.6) {
    // 30-60% → 40-110 points
    scaledScore = 40 + (normalizedScore - 0.3) * 233
  } else if (normalizedScore < 0.85) {
    // 60-85% → 110-160 points
    scaledScore = 110 + (normalizedScore - 0.6) * 200
  } else {
    // 85-100% → 160-200 points
    scaledScore = 160 + (normalizedScore - 0.85) * 267
  }

  return Math.round(Math.min(200, Math.max(0, scaledScore)))
}

// Update generateOverallAssessment to use this function
async generateOverallAssessment(sessionId: string, userId: string) {
  // ... existing code to collect scoresByPart ...

  // Replace AI estimation with formula
  const estimatedScore = this.calculateTOEICScore(scoresByPart)

  // Still use AI for assessment text only
  const prompt = `Based on TOEIC Speaking score of ${estimatedScore}/200, provide 2-3 sentences assessment in Vietnamese about performance, strengths, and areas for improvement.`

  // ... rest of code ...
}
```

**Expected Result:**

- Tất cả câu 2.5/3 → Điểm tổng ~140-160/200 (không phải 10)

---

### ✅ Task 2: Fix Part 4 - Không hiển thị context/question

**Priority:** 🔴 CRITICAL  
**Status:** ⏳ TODO  
**Issue:** Part 4 đang hiển thị context trong lúc recording. Đúng ra Part 4 KHÔNG hiển thị context/question ở bất kỳ phase nào (chỉ audio)

**Files to modify:**

- `client/src/features/exam/pages/FullTestPage/components/TestQuestionView.tsx`

**Solution:**

```typescript
// Update shouldShowContext logic
const shouldShowContext = useMemo(() => {
  if (!currentQuestion) return false

  // Part 4: NEVER show context (audio only)
  if (currentQuestion.partNumber === 4) return false

  // Part 3: Show during prep, hide during recording
  if (currentQuestion.partNumber === 3) {
    return phase === 'preparing'
  }

  // Part 1, 2, 5: Show during prep and recording
  return phase === 'preparing' || phase === 'recording'
}, [currentQuestion, phase])

// Update shouldShowQuestion logic
const shouldShowQuestion = useMemo(() => {
  if (!currentQuestion) return false

  // Part 4: NEVER show question text (audio only)
  if (currentQuestion.partNumber === 4) return false

  // Other parts: show based on existing logic
  return true
}, [currentQuestion])
```

**Expected Result:**

- Part 4: Chỉ thấy timer + record button, KHÔNG thấy context hay question text

---

### ✅ Task 3: Fix Part 4 Timer - Đếm âm

**Priority:** 🔴 CRITICAL  
**Status:** ⏳ TODO  
**Issue:** Timer đếm âm (-41s) thay vì dừng ở 0

**Files to modify:**

- `client/src/features/exam/pages/FullTestPage/components/TestQuestionView.tsx`

**Solution:**

```typescript
// Find the timer useEffect and add safeguard
useEffect(() => {
  if (phase !== 'preparing' && phase !== 'recording') return

  const interval = setInterval(() => {
    setTimeRemaining((prev) => {
      const next = prev - 1

      // SAFEGUARD: Never go below 0
      if (next <= 0) {
        clearInterval(interval)

        if (phase === 'preparing') {
          // Auto-start recording when prep time ends
          handleStartRecording()
        } else if (phase === 'recording') {
          // Auto-stop recording when time ends
          handleStopRecording()
        }

        return 0 // Force to 0, never negative
      }

      return next
    })
  }, 1000)

  return () => clearInterval(interval)
}, [phase])
```

**Expected Result:**

- Timer dừng ở 0, không đếm âm

---

### ✅ Task 4: Add Part 4 Audio Instruction

**Priority:** 🟡 HIGH  
**Status:** ⏳ TODO  
**Issue:** Part 4 không có âm thanh thông báo chuẩn bị, nhảy vào đếm ngược luôn

**Files to modify:**

- `client/src/features/exam/pages/FullTestPage/components/PartInstructionView.tsx`
- Add audio file: `client/src/assets/sounds/instructions/instruction-part-4.mp3`

**Solution:**

```typescript
// Update PartInstructionView.tsx
const getInstructionAudio = (partNumber: number) => {
  switch (partNumber) {
    case 1:
      return instructionPart1Audio
    case 2:
      return instructionPart2Audio
    case 3:
      return instructionPart3Audio
    case 4:
      return instructionPart4Audio // ADD THIS
    case 5:
      return instructionPart5Audio
    default:
      return null
  }
}

// Import the audio
import instructionPart4Audio from '@/assets/sounds/instructions/instruction-part-4.mp3'
```

**Audio content suggestion:**

> "Part 4: Respond to questions using information provided. You will see some information on the screen. You will hear three questions about this information. For each question, you will have 15 seconds to prepare and 15 seconds to respond. Begin preparing now."

**Expected Result:**

- Part 4 có audio instruction trước khi bắt đầu

---

## 🟡 AI SCORING BUGS (Backend)

### ✅ Task 5: Fix Number/Symbol Format Recognition

**Priority:** 🟡 HIGH  
**Status:** ⏳ TODO  
**Issue:** AI flag "$15" vs "fifteen dollars" là lỗi pronunciation

**Files to modify:**

- `server/src/services/response.service.ts` (constant `PART1_READ_ALOUD_PROMPT`)

**Solution:** Update prompt với rule rõ ràng

```typescript
// Add to PART1_READ_ALOUD_PROMPT (after existing rules)
10. NUMBERS AND SYMBOLS - Accept ALL natural spoken forms as CORRECT:
    - "$15" in text → "fifteen dollars" OR "15 dollars" OR "dollar 15" spoken = ALL CORRECT
    - "15" in text → "fifteen" spoken = CORRECT
    - "10%" in text → "ten percent" OR "10 percent" spoken = CORRECT
    - "1st" in text → "first" spoken = CORRECT
    - "&" in text → "and" spoken = CORRECT
    - ONLY flag if NUMBER VALUE is wrong (e.g., "fifty" when text says "15")
    - NEVER flag format differences (symbol vs word)
11. DATES AND TIME - Accept equivalent formats:
    - "Saturday and Sunday" = "Saturday, Sunday" = "Saturday & Sunday" = ALL CORRECT
    - Minor wording differences in dates/times are acceptable

CRITICAL: Do NOT use "pronunciation" category for number/symbol format differences ($15 vs fifteen dollars). These are CORRECT variations.

EXAMPLES OF CORRECT READINGS (do NOT flag these):
Reference: "Tickets cost $15 at the gate."
Transcript: "Tickets cost fifteen dollars at the gate." → CORRECT (no errors)

Reference: "Saturday and Sunday"
Transcript: "Saturday & Sunday" → CORRECT (no errors)
```

**Expected Result:**

- "$15" và "fifteen dollars" được coi là giống nhau

---

### ✅ Task 6: Fix Case Sensitivity

**Priority:** 🟡 HIGH  
**Status:** ⏳ TODO  
**Issue:** AI flag "player of the year" vs "Player of the Year" là lỗi substitution

**Files to modify:**

- `server/src/services/response.service.ts` (ALL prompts: `PART1_READ_ALOUD_PROMPT`, `IMAGE_DESCRIPTION_PROMPT`, `PART35_QUESTION_RESPONSE_PROMPT`)

**Solution:** Add rule to ALL prompts

```typescript
// Add to ALL prompts (near the top of rules section)
CRITICAL RULES:
1. IGNORE capitalization entirely. "city hall" and "City Hall" are IDENTICAL.
2. IGNORE capitalization in ALL comparisons. "player of the year" and "Player of the Year" are IDENTICAL.
3. Do NOT flag capitalization differences as errors.
```

**Expected Result:**

- "player of the year" và "Player of the Year" được coi là giống nhau

---

## 🟢 UI IMPROVEMENTS (Minor)

### ✅ Task 7: Remove Control Panel from Results Page

**Priority:** 🟢 LOW  
**Status:** ⏳ TODO  
**Issue:** Control Panel không cần thiết ở trang kết quả

**Files to modify:**

- `client/src/features/exam/pages/FullTestPage/index.tsx`

**Solution:**

```typescript
// Hide Control Panel when test is completed
{testState.phase !== 'completed' && (
  <ControlPanel>
    {/* ... existing control panel content ... */}
  </ControlPanel>
)}
```

**Expected Result:**

- Không thấy Control Panel ở trang kết quả

---

## 📝 TESTING CHECKLIST

Sau khi fix xong, test các scenario sau:

### Full Test Flow

- [ ] Bắt đầu Full Test
- [ ] Part 1: Đọc text, thấy text trong prep + recording
- [ ] Part 2: Mô tả ảnh, thấy ảnh trong prep + recording
- [ ] Part 3: Trả lời câu hỏi, thấy context trong prep, ẨN trong recording
- [ ] Part 4: Trả lời với info, KHÔNG thấy context/question ở bất kỳ phase nào
- [ ] Part 4: Có audio instruction trước khi bắt đầu
- [ ] Part 4: Timer không đếm âm
- [ ] Part 5: Express opinion, thấy question trong prep + recording
- [ ] Hoàn thành test, xem kết quả

### Score Calculation

- [ ] Tất cả câu 2.5/3 → Điểm tổng ~140-160/200 (không phải 10)
- [ ] Tất cả câu 3/3 → Điểm tổng ~180-200/200
- [ ] Tất cả câu 1.5/3 → Điểm tổng ~70-90/200
- [ ] Mix scores → Điểm hợp lý

### AI Scoring

- [ ] "$15" và "fifteen dollars" không bị flag lỗi
- [ ] "10%" và "ten percent" không bị flag lỗi
- [ ] "Player of the Year" và "player of the year" không bị flag lỗi
- [ ] "City Hall" và "city hall" không bị flag lỗi

---

## 🔄 LONG-TERM REFACTORING (Future)

### Refactor: Merge Practice & Full Test Logic

**Issue:** Practice mode và Full Test mode có 2 bộ code riêng, dẫn đến logic chồng chéo

**Solution:**

1. Tách logic chung ra shared hooks:
   - `useQuestionTimer` - Timer logic
   - `useAudioRecording` - Recording logic
   - `useContextDisplay` - Context display logic
2. Tạo shared components:
   - `QuestionView` - Hiển thị câu hỏi
   - `RecordingControls` - Nút record/stop
3. Practice và Full Test dùng chung logic

**Benefits:**

- Single source of truth
- Dễ maintain
- Không bị bug chồng chéo

---

## 📚 REFERENCES

### TOEIC Speaking Structure

- 11 questions total
- Part 1: Q1-2 (Read aloud) - 0-3 points each
- Part 2: Q3-4 (Describe picture) - 0-3 points each
- Part 3: Q5-7 (Respond to questions) - 0-3 points each
- Part 4: Q8-10 (Respond using info) - 0-3 points each
- Part 5: Q11 (Express opinion) - 0-5 points
- Total raw score: 20 points
- Scaled score: 0-200 (non-linear conversion)

### Score Ranges

- 0-50: Very limited ability
- 60-120: Limited to fair ability
- 130-170: Good to competent ability
- 180-200: Excellent ability

---

## 🎯 PRIORITY ORDER

1. **Task 1** - Fix Score Calculation (ảnh hưởng nghiêm trọng nhất)
2. **Task 2** - Fix Part 4 Context Display (ảnh hưởng trải nghiệm)
3. **Task 3** - Fix Part 4 Timer (ảnh hưởng trải nghiệm)
4. **Task 5 & 6** - Fix AI Scoring (ảnh hưởng công bằng)
5. **Task 4** - Add Part 4 Audio (improve UX)
6. **Task 7** - Remove Control Panel (minor UI)

---

**Created:** 2026-05-17  
**Last Updated:** 2026-05-17  
**Status:** Ready for implementation
