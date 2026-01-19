import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  clientName: string;
  clientEmail: string;
  onboardingUrl: string;
  teamName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, clientEmail, onboardingUrl, teamName }: EmailRequest = await req.json();

    console.log(`Sending onboarding email to ${clientEmail} for ${teamName}`);

    const emailResponse = await resend.emails.send({
      from: "Client Onboarding <onboarding@notifications.stackit.app>",
      to: [clientEmail],
      subject: `Complete Your Onboarding - ${teamName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Complete Your Onboarding - Stackit</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #000000; border-radius: 12px; border: 2px solid #ffc107; box-shadow: 0 0 40px rgba(255, 193, 7, 0.15);">
                    
                    <!-- Logo Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #000000; border-radius: 12px 12px 0 0;">
                        <img src="https://stackit.app/logo.png" alt="Stackit Logo" style="width: 80px; height: 80px; margin-bottom: 20px;" />
                        <h1 style="margin: 0; color: #ffc107; font-size: 32px; font-weight: 700; text-shadow: 0 0 20px rgba(255, 193, 7, 0.3);">Welcome, ${clientName}!</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 20px 40px 40px 40px; background-color: #000000;">
                        <p style="margin: 0 0 20px 0; color: #e0e0e0; font-size: 17px; line-height: 26px;">
                          Thank you for choosing <strong style="color: #ffc107;">${teamName}</strong>. We're excited to get started with you!
                        </p>
                        <p style="margin: 0 0 30px 0; color: #b0b0b0; font-size: 16px; line-height: 24px;">
                          Please complete your secure onboarding form by clicking the button below:
                        </p>
                        
                        <!-- Onboarding Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 0 0 30px 0;">
                              <a href="${onboardingUrl}" style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%); color: #000000; text-decoration: none; border-radius: 8px; font-size: 17px; font-weight: 700; box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3); border: 2px solid #ffc107;">Complete Onboarding Form</a>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="padding: 20px; background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%); border-radius: 8px; margin-bottom: 25px; border: 1px solid rgba(255, 193, 7, 0.3);">
                          <p style="margin: 0 0 10px 0; color: #ffc107; font-size: 14px; line-height: 22px;">
                            <strong>Secure & Private</strong>
                          </p>
                          <p style="margin: 0; color: #b0b0b0; font-size: 13px; line-height: 20px;">
                            Your information is encrypted and stored securely. This link expires in 30 days.
                          </p>
                        </div>
                        
                        <p style="margin: 0 0 10px 0; color: #e0e0e0; font-size: 15px; line-height: 22px; font-weight: 600;">
                          What you'll need:
                        </p>
                        <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #b0b0b0; font-size: 15px; line-height: 24px;">
                          <li>Account credentials (passwords are encrypted)</li>
                          <li>Backup codes and security information</li>
                          <li>Required photos and documents</li>
                        </ul>
                        
                        <p style="margin: 0 0 25px 0; color: #909090; font-size: 14px; line-height: 20px;">
                          Your progress is automatically saved as you fill out the form, so you can complete it at your own pace.
                        </p>
                        
                        <p style="margin: 0; color: #707070; font-size: 14px; line-height: 20px;">
                          If you didn't request this, please ignore this email or contact us if you have concerns.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px 40px 40px; border-top: 2px solid #ffc107; background-color: #000000; border-radius: 0 0 12px 12px;">
                        <p style="margin: 0 0 10px 0; color: #ffc107; font-size: 16px; line-height: 24px; text-align: center; font-weight: 600;">
                          ${teamName}
                        </p>
                        <p style="margin: 0; color: #606060; font-size: 12px; line-height: 18px; text-align: center;">
                          This link expires in 30 days for your security.
                        </p>
                        <p style="margin: 0; color: #606060; font-size: 12px; line-height: 18px; text-align: center;">
                          © ${new Date().getFullYear()} ${teamName}. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log("Onboarding email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending onboarding email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
