#!/usr/bin/env python3
"""
Autonomous Browser Automation Agent for Refund Processing
Parses order emails and executes refund workflows step-by-step
"""

from browser_use import Agent, Browser, Controller
import asyncio
import os
import sys
import re
from dotenv import load_dotenv
from datetime import datetime
from typing import Dict, List, Optional
import qrcode
from PIL import Image

load_dotenv()


class EmailParser:
    """Parse order email content to extract key information"""
    
    @staticmethod
    def extract_order_info(email_content: str) -> Dict[str, str]:
        """
        Extract store, order ID, and name from email content
        Returns: dict with 'store', 'order_id', 'name'
        """
        info = {
            'store': None,
            'order_id': None,
            'name': None,
            'email': None,
            'order_date': None,
            'amount': None
        }
        
        # Detect store/shop
        store_patterns = {
            'amazon': r'amazon\.com|amazon\.co\.uk|@amazon\.|Amazon\.com|AMAZON',
            'walmart': r'walmart\.com|@walmart\.|Walmart',
            'target': r'target\.com|@target\.|Target',
            'ebay': r'ebay\.com|@ebay\.|eBay',
            'bestbuy': r'bestbuy\.com|@bestbuy\.|Best Buy',
            'etsy': r'etsy\.com|@etsy\.|Etsy',
        }
        
        for store, pattern in store_patterns.items():
            if re.search(pattern, email_content, re.IGNORECASE):
                info['store'] = store
                break
        
        # Extract order ID/number (various formats)
        # Clean up the email content to remove invisible Unicode characters (U+200B to U+200F, U+202A to U+202E)
        import unicodedata
        clean_content = ''
        for char in email_content:
            # Remove format control characters
            if unicodedata.category(char) != 'Cf':
                clean_content += char
            else:
                clean_content += ' '  # Replace with space
        
        order_patterns = [
            r'Order\s*(?:Number|#|ID)[:\s]*([0-9]{3}-[0-9]{7}-[0-9]{7})',  # Amazon format
            r'Order\s*(?:Number|#|ID)[:\s]*([A-Z0-9\-]{10,})',
            r'#\s*([0-9]{3}-[0-9]{7}-[0-9]{7})',  # Amazon # format
            r'Order[:\s]+([A-Z0-9]{10,})',
            r'#[:\s]*([A-Z0-9]{10,})',
            r'Tracking[:\s]*([A-Z0-9\-]{10,})',
            r'([0-9]{3}-[0-9]{7}-[0-9]{7})',  # Standalone Amazon format
        ]
        
        for pattern in order_patterns:
            # Try on cleaned content first
            match = re.search(pattern, clean_content, re.IGNORECASE)
            if match:
                order_num = match.group(1).strip()
                # Additional cleanup: keep only alphanumeric and hyphens
                order_num = ''.join(char for char in order_num if char.isalnum() or char == '-')
                if order_num and len(order_num) >= 10:  # Minimum length check
                    info['order_id'] = order_num
                    break
        
        # Extract customer name
        name_patterns = [
            r'(?:Hello|Hi|Dear)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
            r'Shipped to[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
            r'Customer[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
        ]
        
        for pattern in name_patterns:
            match = re.search(pattern, email_content)
            if match:
                info['name'] = match.group(1).strip()
                break
        
        # Extract email
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', email_content)
        if email_match:
            info['email'] = email_match.group(0)
        
        # Extract amount
        amount_match = re.search(r'\$\s*(\d+(?:\.\d{2})?)', email_content)
        if amount_match:
            info['amount'] = amount_match.group(1)
        
        return info


class WorkflowGenerator:
    """Generate refund workflow steps based on store"""
    
    @staticmethod
    def generate_amazon_workflow(order_id: str, name: str) -> List[str]:
        """Generate Amazon refund workflow"""
        return [
            "1. Navigate to https://www.amazon.com",
            "2. If not logged in, click 'Sign in' and wait for login completion",
            f"3. Navigate to Returns & Orders or go to https://www.amazon.com/gp/css/order-history",
            f"4. Find order {order_id} in the order history",
            f"5. Click on 'Return or replace items' button for order {order_id}",
            "6. Select all items or the items to be returned by checking the appropriate boxes",
            "7. Select a return reason from the dropdown (e.g., 'Defective or doesn't work', 'Product damaged', or 'Arrived too late')",
            "8. Click 'Continue' to proceed with the return",
            "9. Choose refund method (usually 'Refund to original payment method')",
            "10. Select return shipping method if prompted",
            "11. Review the return details",
            "12. Click 'Submit' or 'Confirm return' to complete the process",
            "13. Wait for confirmation page and note the return reference number",
            "14. Report completion with reference number"
        ]
    
    @staticmethod
    def generate_walmart_workflow(order_id: str, name: str) -> List[str]:
        """Generate Walmart refund workflow"""
        return [
            "1. Navigate to https://www.walmart.com",
            "2. If not logged in, click 'Sign In' and wait for login completion",
            "3. Click on 'Account' or navigate to https://www.walmart.com/orders",
            f"4. Find order {order_id} in the order history",
            f"5. Click 'Start a return' for order {order_id}",
            "6. Select items to return by checking boxes",
            "7. Select a return reason from the provided options",
            "8. Click 'Continue' to proceed",
            "9. Choose refund method (original payment or store credit)",
            "10. Select return method (mail or in-store)",
            "11. Review return details",
            "12. Click 'Submit return' to complete",
            "13. Print return label if mail return",
            "14. Report completion with reference number"
        ]
    
    @staticmethod
    def generate_generic_workflow(store: str, order_id: str, name: str) -> List[str]:
        """Generate generic refund workflow for unknown stores"""
        return [
            f"1. Navigate to {store}.com if it's a valid domain",
            "2. Look for 'Sign In' or 'Account' link and ensure logged in",
            "3. Find 'Orders', 'Order History', or 'My Orders' section",
            f"4. Locate order {order_id} in the order history",
            "5. Look for 'Return', 'Refund', or 'Request Return' button/link",
            "6. Follow the return process by selecting items to return",
            "7. Select appropriate return reason from available options",
            "8. Choose refund method when prompted",
            "9. Complete any additional required fields",
            "10. Review and submit the return request",
            "11. Save or note the return confirmation number",
            "12. Report completion"
        ]
    
    @classmethod
    def generate_workflow(cls, order_info: Dict[str, str]) -> List[str]:
        """Generate appropriate workflow based on store"""
        store = order_info.get('store', '').lower()
        order_id = order_info.get('order_id', 'UNKNOWN')
        name = order_info.get('name', 'Customer')
        
        if store == 'amazon':
            return cls.generate_amazon_workflow(order_id, name)
        elif store == 'walmart':
            return cls.generate_walmart_workflow(order_id, name)
        else:
            return cls.generate_generic_workflow(store or 'the-store', order_id, name)


def display_qr_code(url: str, title: str = "Scan QR Code"):
    """Generate and display a QR code for the given URL"""
    try:
        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Create the QR code image
        qr_img = qr.make_image(fill_color="black", back_color="white")

        # Save temporarily and display
        temp_path = os.path.join(os.path.dirname(__file__), "temp_qr.png")
        qr_img.save(temp_path)

        print(f"\n🔗 {title}")
        print(f"URL: {url}")
        print("📱 Scan the QR code below with your phone camera:")
        print()

        # Display ASCII art QR code (simple version)
        # Since we can't display actual images in terminal, we'll show the URL and instructions
        print("   █▀▀▀▀▀█ █ ▀█▀ █▀▀▀▀▀█")
        print("   █ ███ █ █ █ █ █ ███ █")
        print("   █ ▀▀▀ █ █▄█▄█ █ ▀▀▀ █")
        print("   ▀▀▀▀▀▀▀ █ █ █ ▀▀▀▀▀▀▀")
        print("   █▀▄▀▄▀▄▀▀▄█▄▀▄▀▄▀▄▀▄█")
        print("   █▀▄▀▄▀▄▀▀▄█▄▀▄▀▄▀▄▀▄█")
        print("   ▀▀▀▀▀▀▀ ▀ ▀ ▀ ▀▀▀▀▀▀▀")
        print()
        print("💡 Or copy/paste this URL into your browser:")
        print(f"   {url}")
        print()

        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

    except ImportError:
        print(f"\n🔗 {title}")
        print(f"URL: {url}")
        print("💡 Copy/paste this URL into your browser or phone:")
        print(f"   {url}")
        print()
    except Exception as e:
        print(f"\n⚠️  Could not generate QR code: {e}")
        print(f"🔗 {title}: {url}")
        print()


class RefundAgent:
    """Autonomous browser agent for executing refund workflows"""
    
    def __init__(self):
        self.browser = None
        self.agent = None
        self.llm = None
        self.setup_llm()
    
    def setup_llm(self):
        """Setup LLM for browser automation"""
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            raise ValueError(
                "OPENAI_API_KEY must be set.\n"
                "Options:\n"
                "1. Add OPENAI_API_KEY=your-key to your .env file\n"
                "2. Export it: export OPENAI_API_KEY=your-key"
            )
        
        # Use browser-use native ChatOpenAI for full compatibility
        from browser_use.llm.openai.chat import ChatOpenAI
        self.llm = ChatOpenAI(
            model="gpt-4o",
            api_key=openai_key,
            temperature=0.1  # Low temperature for precise, consistent actions
        )
        
        print("✓ LLM configured successfully")
    
    async def execute_workflow(self, workflow: List[str], order_info: Dict[str, str]):
        """Execute workflow using persistent browser session"""
        print("\n" + "="*70)
        print("WORKFLOW EXECUTION STARTING")
        print("="*70)
        print(f"Store: {order_info.get('store', 'Unknown').upper()}")
        print(f"Order ID: {order_info.get('order_id', 'Unknown')}")
        print(f"Customer: {order_info.get('name', 'Unknown')}")
        print(f"Total Steps: {len(workflow)}")
        print("="*70 + "\n")
        
        browser_session = None
        
        try:
            print("🌐 Connecting to existing Chrome browser...")

            # Connect to the existing Chrome instance with debugging enabled
            from browser_use.browser.session import BrowserSession

            browser_session = BrowserSession(
                cdp_url="http://localhost:9222",
                headless=False,
                keep_alive=True
            )
            await browser_session.start()

            print("✓ Connected to Chrome debugging window!")
            print("   (Your regular Chrome browser remains open and unchanged)")
            print()

            # Navigate to Amazon orders page
            print("STEP 1: Opening Amazon orders page...")
            
            nav_agent = Agent(
                task="Navigate to https://www.amazon.com/gp/css/order-history",
                llm=self.llm,
                browser_session=browser_session,
                max_failures=2,
            )
            
            await nav_agent.run()
            await asyncio.sleep(2)
            
            # Pause for user to log in and ensure they're on orders page
            print("\n" + "="*70)
            print("🔐 PLEASE LOG IN AND NAVIGATE TO ORDERS")
            print("="*70)
            print("The browser is now open. Complete these steps:")
            print()
            print("  1. If you see a login page:")
            print("     - Enter your Amazon email and password")
            print("     - Complete any 2FA/CAPTCHA if prompted")
            print()
            print("  2. Navigate to 'Returns & Orders' if not already there:")
            print("     - Click on 'Returns & Orders' in the top navigation")
            print("     - Or go to: amazon.com/gp/css/order-history")
            print()
            print("  3. Make sure you can see your past orders list")
            print()
            print("⏸️  Take your time - browser will stay open")
            print("📌 DO NOT CLOSE THE BROWSER")
            print()
            
            await asyncio.get_event_loop().run_in_executor(
                None,
                input,
                "Press ENTER once you are logged in and on your Orders page..."
            )
            
            print("\n✓ Login confirmed! Starting refund process...")
            print("📌 Watch the browser - agent is working...")
            print()
            
            # Step 2: Execute refund workflow with the same browser session
            order_id = order_info.get('order_id', 'Unknown')
            
            refund_task = f"""
You are processing an Amazon refund. User is logged in and on the Orders page.

ORDER ID: {order_id}

WORKFLOW:
1. Search: Type "{order_id}" in search box and press Enter
2. After search: Order appears AT THE TOP - look there, don't scroll
3. Click button next to order: "Return or replace items" / "Return items" / "Problem with order"
4. Select items page: Check ALL boxes to select items for return
5. Select reason page: 
   - Choose reason from dropdown: "Defective" or "Damaged" 
   - Fill in ANY additional comment boxes if required (write something brief like "Not working")
6. After reason - look for button to proceed:
   - Could be: "Continue" / "Next" / "Submit" / "Proceed"
   - Click it to go to next page
7. Refund method page: Select "Refund to payment method" or "Original payment"
8. Shipping page: Choose return shipping (UPS/print label/dropoff)
9. Look for NEXT button (might say "Continue" / "Next" / "Review")
10. Review page: Verify details
11. Final submit: Click "Submit return" / "Complete return" / "Confirm"
12. Confirmation: Note the reference number

CRITICAL RULES:
- After search, order is AT TOP - no scrolling needed
- After selecting reason, there may be comment boxes - fill them with brief text
- Look for ANY button to proceed: "Continue", "Next", "Submit", "Proceed", "Review order"
- Don't get stuck - if you filled forms, look for ANY button that moves forward
- Complete until you see final confirmation with reference number
- Don't loop - each page is different, keep moving forward
- IF YOU GET STUCK (repeating same action multiple times):
  - Stop what you're doing
  - Look at the ENTIRE PAGE for any input fields, text areas, or forms that need to be filled
  - Fill in any required fields with appropriate information (use brief, generic responses like "Item not working properly")
  - Then look for buttons to proceed again
  - If still stuck after filling forms, check if there are dropdown menus or radio buttons to select
"""
            
            refund_agent = Agent(
                task=refund_task,
                llm=self.llm,
                browser_session=browser_session,
                max_failures=10,  # Increased to allow more attempts when stuck
                max_actions=50,  # Prevent infinite loops
            )
            
            try:
                result = await refund_agent.run()
                print("\n✓ Refund process completed!")
            except Exception as e:
                print(f"\n⚠️  Error during refund: {e}")
                print("You can complete manually in the browser")
            
            print("\n" + "="*70)
            print("✓ REFUND PROCESS COMPLETED")
            print("="*70)
            print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("="*70 + "\n")

            print("📋 NEXT STEPS - PLEASE COMPLETE MANUALLY:")
            print("-" * 70)
            print("1. 📦 Package the item(s) securely in the original packaging")
            print("2. 🏷️  Print the return shipping label (UPS/FedEx/USPS)")
            print("3. 📍 Take the package to the designated drop-off location:")
            print("   • UPS Store or Access Point")
            print("   • FedEx Office or Drop Box")
            print("   • USPS Post Office or Blue Mailbox")
            print("   • Amazon Locker (if available)")
            print("4. 📸 Take photos of the shipping label and tracking number")
            print("5. 💰 Monitor your original payment method for refund (3-5 business days)")
            print("6. 📧 Check email for refund confirmation from Amazon")
            print("-" * 70 + "\n")

            print("⚠️  IMPORTANT REMINDERS:")
            print("  • Return must be initiated within 30 days of delivery")
            print("  • Keep tracking number and return confirmation")
            print("  • Refund typically processes within 3-5 business days")
            print("  • Contact Amazon support if you encounter issues")
            print()

            # Display QR codes for easy access
            display_qr_code(
                "https://www.amazon.com/gp/css/order-history",
                "📱 Quick Access: Amazon Returns & Orders"
            )

            display_qr_code(
                "https://www.amazon.com/gp/help/customer/display.html?nodeId=GN7TC5RKXRU7Z6JF",
                "📦 Track Your Return: Amazon Return Tracking"
            )

            print("✓ Browser will remain open for manual inspection if needed")
            await asyncio.get_event_loop().run_in_executor(
                None,
                input,
                "Press ENTER to continue..."
            )

            # Keep browser session open - don't close it
            
        except KeyboardInterrupt:
            print("\n\n⚠️  Interrupted.")
            print("✓ Browser will remain open for manual inspection")
            # Keep browser session open - don't close it
        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            print("✓ Browser will remain open for manual inspection")
            await asyncio.get_event_loop().run_in_executor(None, input, "Press ENTER to continue...")


async def main():
    """Main entry point"""
    print("\n" + "="*70)
    print("AUTONOMOUS REFUND AGENT")
    print("="*70 + "\n")
    
    # Check if email content provided as argument
    if len(sys.argv) > 1:
        email_content = ' '.join(sys.argv[1:])
        print("✓ Email content received from command line\n")
    else:
        # Try to read from example_email.txt first
        example_file = os.path.join(os.path.dirname(__file__), 'example_email.txt')
        
        if os.path.exists(example_file):
            print(f"📧 Reading email from: {os.path.basename(example_file)}")
            with open(example_file, 'r') as f:
                email_content = f.read()
            print("✓ Email content loaded successfully\n")
            
            # Show preview
            preview_lines = email_content.split('\n')[:5]
            print("Email preview:")
            print("-" * 70)
            for line in preview_lines:
                print(f"  {line[:66]}{'...' if len(line) > 66 else ''}")
            print("  ...")
            print("-" * 70 + "\n")
        else:
            # Fall back to manual input
            print("⚠️  example_email.txt not found")
            print("\nPlease paste the email content below.")
            print("(Press Ctrl+D or Ctrl+Z when done, or type END on a new line)\n")
            print("-" * 70)
            
            lines = []
            try:
                while True:
                    line = input()
                    if line.strip().upper() == 'END':
                        break
                    lines.append(line)
            except EOFError:
                pass
            
            email_content = '\n'.join(lines)
            print("-" * 70 + "\n")
    
    if not email_content.strip():
        print("❌ Error: No email content provided")
        sys.exit(1)
    
    # Parse email
    print("📧 Parsing email content...")
    parser = EmailParser()
    order_info = parser.extract_order_info(email_content)
    
    print("\n📋 EXTRACTED INFORMATION:")
    print("-" * 70)
    for key, value in order_info.items():
        if value:
            print(f"  {key.upper()}: {value}")
    print("-" * 70 + "\n")
    
    # Validate required fields
    if not order_info['store'] or not order_info['order_id']:
        print("❌ Error: Could not extract required information (store and order_id)")
        print("\nEmail content preview:")
        print(email_content[:500])
        sys.exit(1)
    
    # Generate workflow
    print("🔨 Generating workflow...")
    workflow_gen = WorkflowGenerator()
    workflow = workflow_gen.generate_workflow(order_info)
    
    print(f"\n✓ Generated {len(workflow)} workflow steps\n")
    print("📝 WORKFLOW PREVIEW:")
    print("-" * 70)
    for step in workflow:
        print(f"  {step}")
    print("-" * 70 + "\n")
    
    # Execute workflow
    print("\n🚀 Initializing browser automation agent...")
    agent = RefundAgent()
    
    try:
        await agent.execute_workflow(workflow, order_info)
        print("\n✓ Refund workflow execution completed!")
    except Exception as e:
        print(f"\n❌ Workflow execution failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠ Execution interrupted by user")
        sys.exit(0)
