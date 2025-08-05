import { Request, Response } from 'express';

export class SupportController {
  /**
   * Send a message to support chat
   */
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { message } = req.body;

      if (!message || !message.trim()) {
        res.status(400).json({
          success: false,
          error: 'Message is required'
        });
        return;
      }

      // Generate automated response
      const autoResponse = SupportController.generateAutoResponse(message);

      res.json({
        success: true,
        data: {
          userMessage: message,
          supportResponse: autoResponse
        },
        message: 'Message sent successfully'
      });
    } catch (error) {
      console.error('Error sending support message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }

  /**
   * Get chat history for user
   */
  static async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      // For now, return empty history (can be extended with database)
      res.json({
        success: true,
        data: [],
        message: 'Chat history retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting chat history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve chat history'
      });
    }
  }

  /**
   * Get FAQ suggestions
   */
  static async getFAQSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const faqSets = [
        [
          "How do I earn rewards?",
          "How do I reset my password?",
          "How do I contact support?",
          "How do I redeem points?",
          "How do I report an issue?"
        ],
        [
          "How do I change my profile picture?",
          "How do I delete my account?",
          "How do I invite friends?",
          "How do I check my points?",
          "How do I update my email?"
        ],
        [
          "How do I turn on notifications?",
          "How do I find recycling centers?",
          "How do I submit feedback?",
          "How do I view my history?",
          "How do I log out?"
        ]
      ];

      const randomSet = faqSets[Math.floor(Math.random() * faqSets.length)];

      res.json({
        success: true,
        data: {
          suggestions: randomSet
        },
        message: 'FAQ suggestions retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting FAQ suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve FAQ suggestions'
      });
    }
  }

  /**
   * Create a support ticket
   */
  static async createTicket(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { subject, description, priority = 'medium', category } = req.body;

      if (!subject || !description) {
        res.status(400).json({
          success: false,
          error: 'Subject and description are required'
        });
        return;
      }

      // For now, return success (can be extended with database)
      res.json({
        success: true,
        data: {
          ticketId: `TICKET-${Date.now()}`,
          subject,
          description,
          priority,
          category,
          status: 'open',
          createdAt: new Date().toISOString()
        },
        message: 'Support ticket created successfully'
      });
    } catch (error) {
      console.error('Error creating support ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create support ticket'
      });
    }
  }

  /**
   * Get user's support tickets
   */
  static async getUserTickets(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      // For now, return empty tickets (can be extended with database)
      res.json({
        success: true,
        data: [],
        message: 'User tickets retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting user tickets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user tickets'
      });
    }
  }

  /**
   * Generate automated response for common questions
   */
  private static generateAutoResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    const responses: { [key: string]: string } = {
      'password': 'To reset your password, go to the login screen and tap "Forgot Password?" to receive a reset link via email.',
      'reward': 'You can earn rewards by completing waste pickups. Each pickup earns you points based on the weight and type of waste.',
      'contact': 'You can contact support through this chat, email us at support@ecowastego.com, or call us at +233-XXX-XXXX.',
      'redeem': 'To redeem your points, go to the Rewards section in the app and select the reward you want to claim.',
      'report': 'To report an issue, please provide details about the problem and we\'ll get back to you as soon as possible.',
      'profile': 'You can update your profile information in the User section of the app.',
      'notification': 'To enable notifications, go to your device settings and allow notifications for the EcoWasteGo app.',
      'recycling': 'You can find nearby recycling centers in the app\'s map section or contact our support team for assistance.',
      'history': 'Your pickup history is available in the History section of the app, where you can view all your past collections.',
      'logout': 'To log out, go to the User section and tap the logout button at the bottom of the screen.'
    };

    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    return 'Thanks for reaching out! Our support team will get back to you soon.';
  }
} 