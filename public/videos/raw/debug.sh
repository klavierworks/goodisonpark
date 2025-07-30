#!/bin/bash

# Debug script to diagnose VP9 conversion issues
# Usage: ./debug_convert.sh [video_file.mp4]

if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <video_file.mp4>"
    echo "This will test conversion on a single file with full debugging"
    exit 1
fi

VIDEO_FILE="$1"

if [[ ! -f "$VIDEO_FILE" ]]; then
    echo "Error: File '$VIDEO_FILE' does not exist."
    exit 1
fi

echo "=== DEBUGGING VP9 CONVERSION ==="
echo "File: $VIDEO_FILE"
echo ""

# Check if ffmpeg and ffprobe are available
echo "1. Checking tools..."
if ! command -v ffmpeg &> /dev/null; then
    echo "ERROR: ffmpeg not found"
    exit 1
fi
if ! command -v ffprobe &> /dev/null; then
    echo "ERROR: ffprobe not found"
    exit 1
fi
echo "✓ ffmpeg and ffprobe found"
echo ""

# Get detailed file info
echo "2. Analyzing input file..."
echo "File size: $(ls -lh "$VIDEO_FILE" | awk '{print $5}')"
ffprobe -v quiet -show_format -show_streams "$VIDEO_FILE"
echo ""

# Check codec specifically
echo "3. Checking video codec..."
codec=$(ffprobe -v quiet -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$VIDEO_FILE" 2>/dev/null)
echo "Detected codec: '$codec'"

if [[ "$codec" != "vp9" ]]; then
    echo "This file is not VP9, exiting."
    exit 0
fi
echo ""

# Test conversion with verbose output
echo "4. Testing conversion..."
output_file="${VIDEO_FILE%.*}_test_fixed.mp4"

echo "Command: ffmpeg -i \"$VIDEO_FILE\" -c:v libx264 -crf 18 -preset fast -c:a copy -movflags +faststart -y \"$output_file\""
echo ""

# Run conversion with full output
ffmpeg -i "$VIDEO_FILE" \
       -c:v libx264 \
       -crf 18 \
       -preset fast \
       -c:a copy \
       -movflags +faststart \
       -y \
       "$output_file"

ffmpeg_exit_code=$?
echo ""
echo "FFmpeg exit code: $ffmpeg_exit_code"

# Check if output file was created
if [[ -f "$output_file" ]]; then
    echo "✓ Output file created: $output_file"
    echo "Output file size: $(ls -lh "$output_file" | awk '{print $5}')"
    
    # Verify the output codec
    echo ""
    echo "5. Verifying output codec..."
    output_codec=$(ffprobe -v quiet -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$output_file" 2>/dev/null)
    echo "Output codec: '$output_codec'"
    
    if [[ "$output_codec" == "h264" ]]; then
        echo "✓ SUCCESS: Conversion worked!"
    else
        echo "✗ FAILED: Output is not H.264"
    fi
else
    echo "✗ FAILED: No output file created"
fi

echo ""
echo "=== DEBUG COMPLETE ==="
