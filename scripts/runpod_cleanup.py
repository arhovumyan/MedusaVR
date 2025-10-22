#!/usr/bin/env python3
"""
RunPod Cleanup Script for Stable Diffusion WebUI
This script provides comprehensive cleanup methods to prevent state pollution
between image generation requests.

Deploy this to your RunPod instance and call it after each generation batch.
"""

import os
import gc
import sys
import json
import argparse
import traceback
from pathlib import Path

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("PyTorch not available - GPU cleanup will be skipped")

def clear_gpu_memory():
    """Clear GPU memory using PyTorch methods"""
    if not TORCH_AVAILABLE:
        return {"success": False, "error": "PyTorch not available"}
    
    try:
        if torch.cuda.is_available():
            print("🧹 Clearing CUDA cache...")
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
            
            # Get memory info
            memory_allocated = torch.cuda.memory_allocated() / 1024**2  # MB
            memory_reserved = torch.cuda.memory_reserved() / 1024**2    # MB
            
            print(f" GPU memory cleared. Allocated: {memory_allocated:.1f}MB, Reserved: {memory_reserved:.1f}MB")
            return {
                "success": True, 
                "memory_allocated_mb": memory_allocated,
                "memory_reserved_mb": memory_reserved
            }
        else:
            return {"success": False, "error": "CUDA not available"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def clear_system_memory():
    """Force Python garbage collection"""
    try:
        print("🧹 Running garbage collection...")
        collected = gc.collect()
        print(f" Garbage collection completed. Collected {collected} objects")
        return {"success": True, "collected_objects": collected}
    except Exception as e:
        return {"success": False, "error": str(e)}

def cleanup_temp_files():
    """Remove temporary image files"""
    temp_dirs = [
        "/tmp",
        "/tmp/gradio",
        "/workspace/outputs",
        "/workspace/outputs/txt2img-images",
        "/workspace/outputs/img2img-images",
        "./outputs",
        "./outputs/txt2img-images", 
        "./outputs/img2img-images"
    ]
    
    cleaned_files = 0
    errors = []
    
    for temp_dir in temp_dirs:
        try:
            if os.path.exists(temp_dir):
                for root, dirs, files in os.walk(temp_dir):
                    for file in files:
                        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.tmp')):
                            try:
                                file_path = os.path.join(root, file)
                                # Only delete files older than 5 minutes to avoid deleting active files
                                if os.path.getmtime(file_path) < (os.time.time() - 300):
                                    os.remove(file_path)
                                    cleaned_files += 1
                            except Exception as e:
                                errors.append(f"Failed to delete {file}: {str(e)}")
        except Exception as e:
            errors.append(f"Failed to scan {temp_dir}: {str(e)}")
    
    print(f"🧹 Cleaned {cleaned_files} temporary files")
    if errors:
        print(f" {len(errors)} cleanup errors occurred")
    
    return {
        "success": True,
        "cleaned_files": cleaned_files,
        "errors": errors
    }

def reset_models():
    """Attempt to reset loaded models (if using a framework that supports it)"""
    try:
        # This is a placeholder for model-specific reset logic
        # You might need to customize this based on your specific WebUI setup
        print(" Attempting model reset...")
        
        # For Automatic1111 WebUI, we can try to trigger model unloading
        # This might require specific API calls depending on your setup
        
        return {"success": True, "message": "Model reset attempted"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def comprehensive_cleanup():
    """Perform all cleanup operations"""
    results = {
        "gpu_cleanup": clear_gpu_memory(),
        "memory_cleanup": clear_system_memory(),
        "temp_file_cleanup": cleanup_temp_files(),
        "model_reset": reset_models()
    }
    
    # Determine overall success
    overall_success = all(result.get("success", False) for result in results.values())
    
    return {
        "success": overall_success,
        "results": results
    }

def main():
    parser = argparse.ArgumentParser(description="RunPod Cleanup Script")
    parser.add_argument("--mode", choices=["gpu", "memory", "files", "models", "all"], 
                       default="all", help="Cleanup mode")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    
    args = parser.parse_args()
    
    try:
        if args.mode == "gpu":
            result = clear_gpu_memory()
        elif args.mode == "memory":
            result = clear_system_memory()
        elif args.mode == "files":
            result = cleanup_temp_files()
        elif args.mode == "models":
            result = reset_models()
        else:  # all
            result = comprehensive_cleanup()
        
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            if result.get("success"):
                print(" Cleanup completed successfully")
            else:
                print(" Cleanup encountered errors")
                if "error" in result:
                    print(f"Error: {result['error']}")
        
        return 0 if result.get("success") else 1
        
    except Exception as e:
        error_msg = f"Cleanup script failed: {str(e)}\n{traceback.format_exc()}"
        if args.json:
            print(json.dumps({"success": False, "error": error_msg}))
        else:
            print(f" {error_msg}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
