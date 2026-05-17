import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! })
const prisma = new PrismaClient({ adapter })

/**
 * Seed topics for each part of the TOEIC Speaking test
 * Each part has specific topic categories based on common test patterns
 */
async function seedTopics() {
  console.log('🌱 Seeding topics for all parts...')

  const topicsByPart = [
    // Part 1: Read a Text Aloud (Câu 1-2)
    // Phần này thường kiểm tra ngữ điệu và phát âm qua các bài đọc ngắn mang tính thông báo
    {
      partNumber: 1,
      topics: [
        {
          name: 'Advertisements',
          description: 'Quảng cáo sản phẩm, dịch vụ mới, sự kiện khai trương cửa hàng',
        },
        {
          name: 'Announcements/Broadcasts',
          description: 'Thông báo tại sân bay, nhà ga, siêu thị hoặc thông báo nội bộ công ty',
        },
        {
          name: 'News & Weather Reports',
          description: 'Bản tin thời sự, cập nhật giao thông, dự báo thời tiết',
        },
        {
          name: 'Telephone Messages',
          description: 'Tin nhắn thoại của dịch vụ chăm sóc khách hàng hoặc hộp thư thoại công ty',
        },
        {
          name: 'Tours & Introductions',
          description: 'Lời giới thiệu của hướng dẫn viên du lịch, giới thiệu diễn giả tại sự kiện',
        },
      ],
    },

    // Part 2: Describe a Picture (Câu 3-4)
    // Trọng tâm là từ vựng miêu tả người, hành động và bối cảnh
    {
      partNumber: 2,
      topics: [
        {
          name: 'Office/Workplace',
          description: 'Cảnh họp hành, làm việc với máy tính, đồng nghiệp đang trao đổi',
        },
        {
          name: 'Dining/Restaurants',
          description: 'Cảnh ăn uống tại nhà hàng, quán cà phê, phục vụ đang ghi order',
        },
        {
          name: 'Street/Outdoor',
          description: 'Cảnh đường phố, công viên, người đi bộ, giao thông',
        },
        {
          name: 'Travel/Transportation',
          description: 'Cảnh hành khách tại sân bay, bến xe, thao tác lên xuống tàu xe',
        },
        {
          name: 'Shopping/Retail',
          description: 'Mua sắm tại siêu thị, cửa hàng quần áo, khách hàng thanh toán tại quầy',
        },
      ],
    },

    // Part 3: Respond to Questions (Câu 5-7)
    // Các câu hỏi phản xạ nhanh xoay quanh thói quen, sở thích và đời sống sinh hoạt thường ngày
    {
      partNumber: 3,
      topics: [
        {
          name: 'Hobbies & Entertainment',
          description: 'Sở thích xem phim, nghe nhạc, đọc sách, chơi thể thao',
        },
        {
          name: 'Travel & Vacations',
          description: 'Kế hoạch kỳ nghỉ, cách thức đi du lịch, trải nghiệm khách sạn',
        },
        {
          name: 'Shopping Habits',
          description: 'Thói quen mua sắm online vs offline, cách chọn lựa cửa hàng',
        },
        {
          name: 'Daily Routines',
          description: 'Phương tiện di chuyển hàng ngày, thói quen ăn uống, công việc nhà',
        },
        {
          name: 'Technology & Communication',
          description: 'Mức độ sử dụng điện thoại, mạng xã hội, thiết bị điện tử',
        },
      ],
    },

    // Part 4: Respond to Questions Using Information Provided (Câu 8-10)
    // Phần này luôn đi kèm với một bảng biểu, yêu cầu bóc tách dữ liệu để trả lời
    {
      partNumber: 4,
      topics: [
        {
          name: 'Meeting/Conference Agendas',
          description: 'Lịch trình hội thảo, diễn giả, thời gian bắt đầu/kết thúc các phiên',
        },
        {
          name: 'Travel Itineraries',
          description: 'Lịch trình chuyến đi công tác, giờ bay, xe đưa đón',
        },
        {
          name: 'Interview Schedules',
          description: 'Lịch phỏng vấn ứng viên, vị trí tuyển dụng, người phụ trách phỏng vấn',
        },
        {
          name: 'Invoices & Orders',
          description: 'Hóa đơn mua hàng, chi tiết đơn đặt hàng, phí dịch vụ sửa chữa',
        },
        {
          name: 'Training/Class Schedules',
          description: 'Lịch đào tạo nhân viên mới, danh sách các khóa học nâng cao kỹ năng',
        },
      ],
    },

    // Part 5: Express an Opinion (Câu 11)
    // Yêu cầu đưa ra quan điểm cá nhân có luận điểm và ví dụ chứng minh
    {
      partNumber: 5,
      topics: [
        {
          name: 'Workplace Environment',
          description:
            'Làm việc tại nhà vs tại văn phòng, làm việc nhóm vs cá nhân, cân bằng giữa lương bổng và đam mê',
        },
        {
          name: 'Education & Learning',
          description:
            'Học online vs học trực tiếp, vai trò của giáo viên, kỹ năng mềm sinh viên cần có',
        },
        {
          name: 'Business & Management',
          description:
            'Tầm quan trọng của chăm sóc khách hàng, chiến lược quảng cáo, chính sách đãi ngộ nhân sự',
        },
        {
          name: 'Modern Lifestyle',
          description:
            'Sống ở thành thị vs nông thôn, ảnh hưởng của công nghệ đến đời sống, vấn đề bảo vệ môi trường',
        },
      ],
    },
  ]

  let totalCreated = 0

  for (const part of topicsByPart) {
    console.log(`\n📚 Seeding topics for Part ${part.partNumber}...`)

    for (const topic of part.topics) {
      const created = await prisma.topic.upsert({
        where: {
          name_partNumber: {
            name: topic.name,
            partNumber: part.partNumber,
          },
        },
        update: {
          description: topic.description,
        },
        create: {
          name: topic.name,
          partNumber: part.partNumber,
          description: topic.description,
        },
      })

      console.log(`  ✅ ${created.name}`)
      totalCreated++
    }
  }

  console.log(`\n✨ Successfully seeded ${totalCreated} topics across all 5 parts!`)
}

seedTopics()
  .catch((e) => {
    console.error('❌ Error seeding topics:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
