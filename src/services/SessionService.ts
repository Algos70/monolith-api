import { Request, Response } from "express";

export class SessionService {
  // Save session with error handling
  static async saveSession(req: Request): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          reject(new Error('Session save failed'));
        } else {
          resolve();
        }
      });
    });
  }

  // Destroy session with cleanup
  static async destroySession(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          reject(new Error('Session destruction failed'));
        } else {
          res.clearCookie("connect.sid"); // Default session cookie name
          resolve();
        }
      });
    });
  }

  // Check if user is authenticated
  static isAuthenticated(req: Request): boolean {
    return !!req.session.user;
  }

  // Store PKCE data in session
  static storePKCEData(req: Request, codeVerifier: string, state: string): void {
    req.session.codeVerifier = codeVerifier;
    req.session.state = state;
  }

  // Get PKCE data from session
  static getPKCEData(req: Request): { codeVerifier?: string; state?: string } {
    return {
      codeVerifier: req.session.codeVerifier,
      state: req.session.state
    };
  }

  // Store user in session
  static storeUser(req: Request, user: any): void {
    req.session.user = user;
  }

  // Get user from session
  static getUser(req: Request): any {
    return req.session.user;
  }

  // Clear temporary session data
  static clearTemporaryData(req: Request): void {
    delete req.session.codeVerifier;
    delete req.session.state;
  }
}