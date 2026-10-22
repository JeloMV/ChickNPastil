# ChickNPastil

To set up ngrok step-by-step for your project so you can get your webhook URL for PayMongo, here is a clean, ready-to-use README guide that you can copy and paste directly into your project files or notes:

Markdown
# Step-by-Step Guide: Setting Up ngrok for PayMongo Webhooks

Follow these instructions to expose your local XAMPP/Express POS server to the public internet using ngrok so PayMongo can send webhook events to it.

---

### Step 1: Download and Install ngrok
1. Go to the [ngrok download page](https://ngrok.com/download) and download the Windows version (`.zip`).
2. Extract the file to a simple folder on your computer (e.g., `C:\ngrok`).
3. You should see `ngrok.exe` inside that folder.

### Step 2: Add ngrok to Windows Environment Variables (Path)
1. Press the **Windows Key**, type **Environment Variables**, and click **Edit the system environment variables**.
2. Click the **Environment Variables...** button at the bottom right.
3. Under **System variables**, select the **Path** variable and click **Edit...**.
4. Click **New** and paste the folder path where you placed ngrok:
   ```text
   C:\ngrok
Click OK on all windows to save.

Important: Close your current terminal/PowerShell window completely and open a new one.

Step 3: Connect your ngrok Account
Log in to your ngrok dashboard (you can use the "Share Localhost" option on your current screen to get started).

Copy your Authtoken from your ngrok dashboard.

Run this command in your new PowerShell terminal (replace with your actual token):

Bash
ngrok config add-authtoken your_token_here
Step 4: Run your Local Server & Start the Tunnel
Ensure your Node.js/Express POS app is running locally (e.g., on port 3000):

Bash
npm start
Open a second separate PowerShell window and start ngrok pointing to your local port:

Bash
ngrok http 3000
Step 5: Get your Webhook URL
Look at the ngrok terminal dashboard. Find the line that says Forwarding.

Copy the HTTPS URL provided (e.g., https://xxxx-xx-xx.ngrok-free.app).

Append your backend webhook route to it. Your final Endpoint URL will look like:

Plaintext
[https://xxxx-xx-xx.ngrok-free.app/api/webhooks/paymongo](https://xxxx-xx-xx.ngrok-free.app/api/webhooks/paymongo)
Paste this full URL into your PayMongo Dashboard > Webhooks > Add Endpoint section to generate your Webhook Secret Key (whsk_test_...)!