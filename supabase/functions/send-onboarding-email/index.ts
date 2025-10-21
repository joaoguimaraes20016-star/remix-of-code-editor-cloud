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
      from: "Client Onboarding <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `Complete Your Onboarding - ${teamName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              .security-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome, ${clientName}!</h1>
              </div>
              <div class="content">
                <p>Thank you for choosing ${teamName}. We're excited to get started with you!</p>
                
                <p>Please complete your secure onboarding form by clicking the button below:</p>
                
                <div style="text-align: center;">
                  <a href="${onboardingUrl}" class="button">Complete Onboarding Form</a>
                </div>
                
                <div class="security-note">
                  <strong>🔒 Secure & Private</strong><br>
                  Your information is encrypted and stored securely. This link expires in 30 days.
                </div>
                
                <p><strong>What you'll need:</strong></p>
                <ul>
                  <li>Account credentials (passwords are encrypted)</li>
                  <li>Backup codes and security information</li>
                  <li>Required photos and documents</li>
                </ul>
                
                <p>Your progress is automatically saved as you fill out the form, so you can complete it at your own pace.</p>
                
                <p style="margin-top: 30px;">If you didn't request this, please ignore this email or contact us if you have concerns.</p>
              </div>
              <div class="footer">
                <p>This link expires in 30 days for your security.</p>
                <p>&copy; ${new Date().getFullYear()} ${teamName}. All rights reserved.</p>
              </div>
            </div>
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
