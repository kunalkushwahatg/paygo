"""
Main workflow for Invoice Processing Pipeline
Integrates Azure OCR and OpenAI extraction for complete invoice processing

Workflow:
1. Azure OCR: Extract raw invoice data from document (URL or local file)
2. Structure Data: Convert Azure OCR output to structured format
3. OpenAI Enhancement: Use GPT to enhance and validate extracted data
4. Save Results: Export final JSON data

Usage:
    python main.py --url <invoice_url>
    python main.py --file <local_invoice_path>
    python main.py  # Uses default sample
"""

import argparse
import json
import sys
from pathlib import Path
from datetime import datetime

# Import our custom modules
from ocr import process_invoice_ocr, extract_invoice_data, print_invoice_details
from extract_json import extract_invoice_fields_from_ocr


def process_invoice_workflow(document_url=None, document_path=None, output_dir="output", verbose=False):
    """
    Complete invoice processing workflow.
    
    Args:
        document_url: URL of invoice document (optional)
        document_path: Path to local invoice document (optional)
        output_dir: Directory to save output files
        verbose: Print detailed output
    
    Returns:
        dict: Final processed invoice data
    """
    print("\n" + "="*60)
    print("🚀 INVOICE PROCESSING PIPELINE")
    print("="*60)
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Generate timestamp for filenames
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Step 1: Azure OCR Processing
    print("\n📄 Step 1: Azure OCR Processing")
    print("-" * 60)
    try:
        if document_url:
            print(f"Processing URL: {document_url}")
        elif document_path:
            print(f"Processing file: {document_path}")
        else:
            print("No document provided, using sample invoice")
            document_url = "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-REST-api-samples/master/curl/form-recognizer/invoice_sample.jpg"
        
        invoices = process_invoice_ocr(
            document_url=document_url,
            document_path=document_path
        )
        print("✅ OCR completed successfully")
        
    except Exception as e:
        print(f"❌ OCR failed: {str(e)}")
        sys.exit(1)
    
    # Step 2: Extract structured data from OCR
    print("\n📊 Step 2: Extracting Structured Data")
    print("-" * 60)
    try:
        ocr_data = extract_invoice_data(invoices)
        print("✅ Data extraction completed")
        
        # Save raw OCR output
        ocr_output_file = output_path / f"ocr_output_{timestamp}.json"
        with open(ocr_output_file, "w") as f:
            json.dump(ocr_data, f, indent=4)
        print(f"💾 Saved OCR data to: {ocr_output_file}")
        
    except Exception as e:
        print(f"❌ Data extraction failed: {str(e)}")
        sys.exit(1)
    
    # Step 3: OpenAI Enhancement
    print("\n🤖 Step 3: AI Enhancement with OpenAI")
    print("-" * 60)
    try:
        print("Sending data to OpenAI for enhancement...")
        enhanced_data = extract_invoice_fields_from_ocr(ocr_data)
        print("✅ AI enhancement completed")
        
        # Save enhanced data
        enhanced_output_file = output_path / f"enhanced_invoice_{timestamp}.json"
        with open(enhanced_output_file, "w") as f:
            json.dump(enhanced_data, f, indent=4)
        print(f"💾 Saved enhanced data to: {enhanced_output_file}")
        
    except Exception as e:
        print(f"⚠️  OpenAI enhancement failed: {str(e)}")
        print("Continuing with OCR data only...")
        enhanced_data = None
    
    # Step 4: Display Results
    print("\n📋 Step 4: Results Summary")
    print("=" * 60)
    
    if verbose:
        print("\n🔍 Detailed OCR Output:")
        print_invoice_details(invoices)
    
    print("\n📌 Key Invoice Fields (OCR):")
    print("-" * 60)
    
    if ocr_data.get("invoice_id"):
        print(f"Invoice ID: {ocr_data['invoice_id']['value']} "
              f"(confidence: {ocr_data['invoice_id']['confidence']:.2f})")
    
    if ocr_data.get("vendor_name"):
        print(f"Vendor: {ocr_data['vendor_name']['value']} "
              f"(confidence: {ocr_data['vendor_name']['confidence']:.2f})")
    
    if ocr_data.get("invoice_total"):
        print(f"Total Amount: ${ocr_data['invoice_total']['value']} "
              f"(confidence: {ocr_data['invoice_total']['confidence']:.2f})")
    
    if ocr_data.get("invoice_date"):
        print(f"Invoice Date: {ocr_data['invoice_date']['value']} "
              f"(confidence: {ocr_data['invoice_date']['confidence']:.2f})")
    
    if ocr_data.get("due_date"):
        print(f"Due Date: {ocr_data['due_date']['value']} "
              f"(confidence: {ocr_data['due_date']['confidence']:.2f})")
    
    if enhanced_data:
        print("\n✨ AI-Enhanced Fields:")
        print("-" * 60)
        for key, value in enhanced_data.items():
            if value and value.get("value") != "nil":
                print(f"{key.replace('_', ' ').title()}: {value['value']} "
                      f"(confidence: {value['confidence']:.2f})")
    
    # Final summary
    print("\n" + "=" * 60)
    print("✅ PIPELINE COMPLETED SUCCESSFULLY")
    print("=" * 60)
    print(f"📁 Output directory: {output_path.absolute()}")
    print(f"📄 OCR data: {ocr_output_file.name}")
    if enhanced_data:
        print(f"✨ Enhanced data: {enhanced_output_file.name}")
    print("=" * 60 + "\n")
    
    return {
        "ocr_data": ocr_data,
        "enhanced_data": enhanced_data,
        "files": {
            "ocr": str(ocr_output_file),
            "enhanced": str(enhanced_output_file) if enhanced_data else None
        }
    }


def main():
    """Main entry point with CLI argument parsing."""
    parser = argparse.ArgumentParser(
        description="Invoice Processing Pipeline with Azure OCR and OpenAI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py
  python main.py --url https://example.com/invoice.pdf
  python main.py --file ./invoices/invoice_001.pdf
  python main.py --file invoice.jpg --verbose
  python main.py --url https://example.com/invoice.pdf --output results
        """
    )
    
    parser.add_argument(
        "--url",
        help="URL of the invoice document to process"
    )
    
    parser.add_argument(
        "--file",
        help="Path to local invoice document"
    )
    
    parser.add_argument(
        "--output",
        default="output",
        help="Output directory for results (default: output)"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Print detailed OCR output"
    )
    
    args = parser.parse_args()
    
    # Validate inputs
    if args.url and args.file:
        print("Error: Please provide either --url OR --file, not both")
        sys.exit(1)
    
    if args.file and not Path(args.file).exists():
        print(f"Error: File not found: {args.file}")
        sys.exit(1)
    
    # Run the workflow
    try:
        result = process_invoice_workflow(
            document_url=args.url,
            document_path=args.file,
            output_dir=args.output,
            verbose=args.verbose
        )
        sys.exit(0)
    except KeyboardInterrupt:
        print("\n\n⚠️  Process interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
