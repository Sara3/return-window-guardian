# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Set up your OpenAI API Key

Create a `.env` file in this directory:

```bash
echo "OPENAI_API_KEY=your-key-here" > .env
```

Get your API key from: https://platform.openai.com/api-keys

### 2. Test the System (Optional but Recommended)

```bash
source venv/bin/activate
python test_full_system.py
```

This will verify everything is working without using your API credits.

### 3. (Optional) Edit example_email.txt

The agent now automatically reads from `example_email.txt`. You can:

**Option A:** Use the existing example (Amazon order #111-1387226-9527459)

**Option B:** Replace the content with your own order email

```bash
# Edit with your preferred editor
nano example_email.txt
# or
open -e example_email.txt
```

### 4. Run the Agent

```bash
source venv/bin/activate
python main.py
```

Or use the quick launcher:

```bash
./run.sh
```

The agent will automatically read your email from `example_email.txt` - no need to paste anything!

**Alternative:** You can still provide email via command line:
```bash
python main.py "Your Amazon order 123-456... has shipped"
```

---

## 📧 Example Email Format

```
Hello Sarah Johnson,

Your Amazon.com order has been shipped!

Order Number: 123-4567890-1234567
Order Date: November 20, 2025
Total: $49.99

Item: Wireless Bluetooth Headphones

Thank you for shopping with us!
Amazon.com
```

---

## 🔍 What the Agent Does

1. **Parses** your email to extract:
   - Store name (Amazon, Walmart, etc.)
   - Order ID
   - Customer name

2. **Generates** a store-specific refund workflow

3. **Executes** each step automatically:
   - Opens browser
   - Navigates to store
   - Finds your order
   - Initiates return/refund
   - Submits the request

4. **Reports** progress for each step

---

## ⚠️ Important Notes

**Before Running:**
- You must be logged into your store account (the agent will wait)
- Have your login credentials ready if needed
- The agent uses GPT-4, which costs about $0.01-0.05 per run

**During Execution:**
- Don't close the browser window
- The agent will report progress in the terminal
- If a step fails, it will try to continue

**After Completion:**
- Verify the refund was submitted
- Check your email for confirmation
- Save any return labels if needed

---

## 🛡️ Safety Features

✅ Only operates on specified store domains  
✅ Doesn't modify account settings  
✅ Doesn't change payment methods  
✅ Uses minimal, precise actions  
✅ Step-by-step execution with reporting  
✅ Gracefully handles UI changes  

---

## 🆘 Troubleshooting

### "'ChatOpenAI' object has no attribute 'provider'"
**Solution:** This was fixed! Make sure you're using the updated `main.py`. The code now uses `browser_use.llm.openai.chat.ChatOpenAI` instead of langchain.

### "ModuleNotFoundError"
**Solution:** Make sure you're in the virtual environment:
```bash
source venv/bin/activate
```

### "OPENAI_API_KEY must be set"
**Solution:** Create `.env` file with your API key:
```bash
echo "OPENAI_API_KEY=sk-your-key" > .env
```

### Browser doesn't open
**Solution:** Reinstall Playwright:
```bash
source venv/bin/activate
pip install --force-reinstall playwright
playwright install chromium
```

### Order not found
**Possible causes:**
- Wrong account logged in
- Order number incorrect in email
- Order too old or already returned

---

## 💡 Tips

1. **Test First**: Use `python test_parser.py` to verify email parsing works
2. **Stay Logged In**: Log into your store account before running
3. **Watch Closely**: Monitor the first execution to ensure it works correctly
4. **Save Output**: The terminal shows all steps and results

---

## 📝 Supported Stores

- ✅ Amazon
- ✅ Walmart
- ✅ Target
- ✅ eBay
- ✅ Best Buy
- ✅ Etsy
- ✅ Generic stores (auto-adapts)

---

## 🎯 Example Usage

```bash
# Activate environment
source venv/bin/activate

# Run agent (interactive mode)
python main.py

# Or provide email via command line
python main.py "Your Amazon order 123-456... has shipped..."

# Test parser only (no browser)
python test_parser.py
```

---

## ❓ Need Help?

See full documentation in `README.md`

**Remember:** This tool automates legitimate refund requests. Use responsibly and follow store policies!

