#!/bin/bash
# Script to re-encode VP9 MP4 files to H.264
# Usage: ./convert_vp9.sh [directory]
# If no directory specified, uses current directory

# Set the target directory (default to current directory if not provided)
TARGET_DIR="${1:-.}"

# Check if target directory exists
if [[ ! -d "$TARGET_DIR" ]]; then
    echo "Error: Directory '$TARGET_DIR' does not exist."
    exit 1
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed or not in PATH."
    exit 1
fi

echo "Processing MP4 files in: $TARGET_DIR"
echo "----------------------------------------"

# Counter for processed files
processed_count=0
converted_count=0

# Find all MP4 files in the directory
find "$TARGET_DIR" -maxdepth 1 -name "*.mp4" -type f | while read -r file; do
    echo "Checking: $(basename "$file")"
    
    # Get codec information using ffprobe
    codec=$(ffprobe -v quiet -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$file")
    
    if [[ $? -ne 0 ]]; then
        echo "  Warning: Could not determine codec for $(basename "$file")"
        echo "  Trying detailed probe..."
        ffprobe "$file" 2>&1 | head -20
        continue
    fi
    
    # Clean up codec string (remove trailing commas and whitespace)
    codec=$(echo "$codec" | sed 's/[, ]*$//')
    
    echo "  Detected codec: '$codec'"
    
    processed_count=$((processed_count + 1))
    
    if [[ "$codec" == "vp9" ]]; then
        echo "  VP9 detected - converting to H.264..."
        
        # Extract filename without extension
        filename=$(basename "$file" .mp4)
        dirname=$(dirname "$file")
        output_file="$dirname/${filename}_fixed.mp4"
        
        # Check if output file already exists
        if [[ -f "$output_file" ]]; then
            echo "  Warning: Output file already exists, skipping: $(basename "$output_file")"
            continue
        fi
        
        # Re-encode with H.264 using high quality settings
        echo "  Running ffmpeg..."
        ffmpeg -i "$file" \
               -c:v libx264 \
               -crf 18 \
               -preset fast \
               -c:a copy \
               -movflags +faststart \
               -y \
               "$output_file"
        
        if [[ $? -eq 0 && -s "$output_file" ]]; then
            echo "  ✓ Successfully converted: $(basename "$output_file")"
            rm "$file" # Remove original file after conversion
            echo "  Original file removed: $(basename "$file")"
            mv "$output_file" "$file" # Rename output file to original name
            echo "  Output file renamed to: $(basename "$file")"
            converted_count=$((converted_count + 1))
        else
            echo "  ✗ Failed to convert: $(basename "$file")"
            rm -f "$output_file"  # Clean up failed conversion
        fi
    else
        echo "  Codec: $codec - leaving unchanged"
    fi
    
    echo ""
done

echo "Processing complete!"
echo "Files converted: $converted_count"