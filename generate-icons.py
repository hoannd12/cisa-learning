"""Generate simple PNG icons for the PWA manifest."""
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    # If Pillow not available, create minimal valid PNGs manually
    import struct, zlib

    def create_png(size, filename):
        """Create a minimal solid-color PNG."""
        width = height = size
        # Blue background (#003366)
        r, g, b = 0, 51, 102
        
        # PNG raw image data (RGBA rows)
        raw_data = b''
        for y in range(height):
            raw_data += b'\x00'  # filter byte
            for x in range(width):
                raw_data += bytes([r, g, b, 255])
        
        def png_chunk(chunk_type, data):
            chunk = chunk_type + data
            return struct.pack('>I', len(data)) + chunk + struct.pack('>I', zlib.crc32(chunk) & 0xffffffff)
        
        # Build PNG file
        header = b'\x89PNG\r\n\x1a\n'
        ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
        idat = zlib.compress(raw_data)
        
        png = header
        png += png_chunk(b'IHDR', ihdr)
        png += png_chunk(b'IDAT', idat)
        png += png_chunk(b'IEND', b'')
        
        with open(filename, 'wb') as f:
            f.write(png)
        print(f"  Created: {filename} ({size}x{size})")

    import os
    base = os.path.dirname(os.path.abspath(__file__))
    create_png(192, os.path.join(base, 'icon-192.png'))
    create_png(512, os.path.join(base, 'icon-512.png'))
    print("Done!")
else:
    import os
    base = os.path.dirname(os.path.abspath(__file__))
    
    for size in [192, 512]:
        img = Image.new('RGB', (size, size), '#003366')
        draw = ImageDraw.Draw(img)
        # Draw "CISA" text centered
        text = "CISA"
        font_size = size // 4
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = (size - tw) // 2
        y = (size - th) // 2
        draw.text((x, y), text, fill='white', font=font)
        
        filename = os.path.join(base, f'icon-{size}.png')
        img.save(filename)
        print(f"  Created: {filename} ({size}x{size})")
    
    print("Done!")
