# Autonomous Refund Agent

An intelligent browser automation agent that processes refunds automatically by parsing order emails and executing store-specific workflows.

## Features

- 🤖 **Autonomous Execution**: Fully automated refund processing workflow
- 📧 **Email Parsing**: Extracts order details (store, order ID, customer name) from email content
- 🏪 **Multi-Store Support**: Pre-configured workflows for Amazon, Walmart, and generic stores
- 📊 **Step-by-Step Reporting**: Real-time status updates for each workflow step
- 🛡️ **Safety First**: Built-in safeguards to prevent unauthorized actions
- 🔄 **UI Adaptation**: Handles UI changes by choosing closest safe equivalent actions

## Supported Stores

- Amazon
- Walmart
- Target
- eBay
- Best Buy
- Etsy
- Generic workflow for other stores

## Prerequisites

- Python 3.8+
- OpenAI API key

## Installation

1. **Clone or download this project**

2. **Create and activate virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Install Playwright browsers**:
   ```bash
   playwright install
   ```

5. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

## Usage

### Method 1: Use example_email.txt (Easiest - Recommended)

The agent automatically reads from `example_email.txt`:

```bash
# Edit the file with your order email (or use the existing example)
nano example_email.txt

# Run the agent (it will automatically use the file)
source venv/bin/activate
python main.py
```

Or use the quick launcher:
```bash
./run.sh
```

### Method 2: Command Line Argument

```bash
source venv/bin/activate
python main.py "Your email content here..."
```

### Method 3: Interactive Mode (Manual Paste)

If `example_email.txt` doesn't exist, the agent will prompt you:

```bash
source venv/bin/activate
python main.py
# Then paste email and press Ctrl+D
```

### Example Email Content

```
Hello John Smith,

Your Amazon.com order #123-4567890-1234567 has shipped.

Order Details:
- Product: Wireless Headphones
- Amount: $49.99
- Estimated Delivery: Dec 25, 2025

Thank you for shopping with us!
```

## How It Works

1. **Email Parsing**: The agent extracts:
   - Store/Shop name
   - Order ID/Number
   - Customer name
   - Additional details (email, amount, date)

2. **Workflow Generation**: Creates store-specific step-by-step instructions

3. **Execution**: Opens browser and executes each step:
   - Navigates to store website
   - Accesses order history
   - Initiates return/refund process
   - Selects items and reasons
   - Submits refund request

4. **Reporting**: Provides real-time status updates for each step

## Safety Features

- ✅ Only operates within specified store domains
- ✅ Minimal, precise actions (no unnecessary clicks)
- ✅ Does NOT modify account settings or payment methods
- ✅ Does NOT perform irreversible actions unless required
- ✅ Gracefully handles UI changes
- ✅ Step-by-step confirmation and reporting

## Workflow Steps Example (Amazon)

1. Navigate to Amazon.com
2. Ensure user is logged in
3. Navigate to Returns & Orders
4. Find specific order by ID
5. Click "Return or replace items"
6. Select items to return
7. Choose return reason
8. Continue with return process
9. Select refund method
10. Choose return shipping
11. Review details
12. Submit return request
13. Capture confirmation number
14. Report completion

## Troubleshooting

### Browser not opening
- Ensure Playwright is installed: `playwright install`
- Try reinstalling: `pip install --force-reinstall playwright`

### Module not found errors
- Activate virtual environment: `source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`

### OpenAI API errors
- Verify your API key is set in `.env`
- Check API key is valid at https://platform.openai.com/api-keys
- Ensure you have API credits available

### Order not found
- Verify the email contains the order number
- Check you're logged into the correct account
- Manually verify order exists on store website

## Configuration

### Using Different AI Models

Edit `main.py` line 169 to change the model:

```python
self.llm = ChatOpenAI(
    model="gpt-4o",  # or "gpt-3.5-turbo" for faster/cheaper
    api_key=openai_key,
    temperature=0.1
)
```

### Adding Custom Store Workflows

Add a new method in the `WorkflowGenerator` class:

```python
@staticmethod
def generate_mystore_workflow(order_id: str, name: str) -> List[str]:
    return [
        "1. Navigate to https://mystore.com",
        "2. Click 'My Orders'",
        # ... add your steps
    ]
```

Then update the `generate_workflow` method to use it.

## Important Notes

⚠️ **This tool automates refund requests but:**
- You must be logged into your account (agent will wait if not)
- Some stores may require 2FA or manual verification
- Always verify the refund was submitted successfully
- Check your email for confirmation
- Return shipping may still be required

⚠️ **Legal & Ethical Use:**
- Only use for legitimate refund requests
- Follow store policies and terms of service
- Do not abuse return/refund systems
- Verify you have valid reasons for returns

## License

MIT License - Use at your own risk

## Contributing

Feel free to submit issues and enhancement requests!

## Disclaimer

This tool is for educational and legitimate use only. Users are responsible for complying with store policies and applicable laws. The authors are not liable for any misuse or damages.

