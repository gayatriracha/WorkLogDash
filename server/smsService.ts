export interface SMSService {
  sendVerificationCode(phoneNumber: string, code: string): Promise<void>;
}

class MockSMSService implements SMSService {
  async sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
    // For development, just log the code
    console.log('📱 SMS Verification Code (Development Mode):');
    console.log(`   To: ${phoneNumber}`);
    console.log(`   Code: ${code}`);
    console.log('');
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// For production, you could implement a real SMS service here
// using Twilio, AWS SNS, or another SMS provider
class TwilioSMSService implements SMSService {
  async sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
    // This would be implemented with actual Twilio credentials
    // For now, fallback to mock service
    console.log('🚧 Twilio SMS service not configured, using mock service');
    const mockService = new MockSMSService();
    await mockService.sendVerificationCode(phoneNumber, code);
  }
}

// Export the appropriate service based on environment
export const smsService: SMSService = process.env.TWILIO_ACCOUNT_SID 
  ? new TwilioSMSService()
  : new MockSMSService();