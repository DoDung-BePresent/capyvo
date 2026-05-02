export const ERROR_MESSAGES: Record<string, string> = {
  subscription_expired: 'Gói đăng ký của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục!',
  no_subscription: 'Bạn chưa có gói đăng ký. Vui lòng mua gói để sử dụng tính năng này!',
  transcription_failed: 'Không thể chuyển đổi giọng nói thành văn bản. Vui lòng thử lại!',
  analysis_failed: 'Không thể phân tích bài làm. Vui lòng thử lại!',
  audio_upload_failed: 'Không thể tải lên file âm thanh. Vui lòng thử lại!',
  session_not_found: 'Phiên luyện tập không tồn tại.',
  question_not_found: 'Câu hỏi không tồn tại.',
  response_not_found: 'Bài làm không tồn tại.',
  permission_denied: 'Bạn không có quyền thực hiện thao tác này.',
  network_error: 'Lỗi kết nối mạng. Vui lòng kiểm tra và thử lại!',
  server_error: 'Lỗi hệ thống. Vui lòng thử lại sau!',
  unknown_error: 'Đã có lỗi xảy ra. Vui lòng thử lại!',
}

export function getErrorMessage(errorCode?: string): string {
  if (!errorCode) return ERROR_MESSAGES.unknown_error
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.unknown_error
}
