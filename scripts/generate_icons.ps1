Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\dommi\.gemini\antigravity-ide\brain\37c08e19-fe6f-4eb9-90eb-cc8e664e5f5d\.user_uploaded\media_1788386542634.jpg'
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image($img, $width, $height, $outPath) {
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $destImg = New-Object System.Drawing.Bitmap($width, $height)
    $destImg.SetResolution($img.HorizontalResolution, $img.VerticalResolution)
    $graphics = [System.Drawing.Graphics]::FromImage($destImg)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($img, $destRect, 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()
    $destImg.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destImg.Dispose()
    Write-Host ("Generated " + $outPath)
}

function Resize-Maskable($img, $size, $outPath) {
    # Sample background color from corner pixel
    $bmp = New-Object System.Drawing.Bitmap($img)
    $bgColor = $bmp.GetPixel(5, 5)
    $bmp.Dispose()
    
    $destImg = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($destImg)
    $graphics.Clear($bgColor)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    
    # Safe zone scale (80% centered without cropping)
    $innerSize = [int]($size * 0.82)
    $offset = [int](($size - $innerSize) / 2)
    $destRect = New-Object System.Drawing.Rectangle($offset, $offset, $innerSize, $innerSize)
    $graphics.DrawImage($img, $destRect, 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()
    $destImg.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destImg.Dispose()
    Write-Host ("Generated Maskable " + $outPath)
}

Resize-Image $srcImg 32 32 'c:\Users\dommi\Desktop\smart_finances\icons\favicon-32.png'
Resize-Image $srcImg 180 180 'c:\Users\dommi\Desktop\smart_finances\icons\apple-touch-icon.png'
Resize-Image $srcImg 192 192 'c:\Users\dommi\Desktop\smart_finances\icons\icon-192.png'
Resize-Image $srcImg 512 512 'c:\Users\dommi\Desktop\smart_finances\icons\icon-512.png'
Resize-Maskable $srcImg 192 'c:\Users\dommi\Desktop\smart_finances\icons\icon-maskable-192.png'
Resize-Maskable $srcImg 512 'c:\Users\dommi\Desktop\smart_finances\icons\icon-maskable-512.png'

# Also save source_icon.png copy
Copy-Item $srcPath 'c:\Users\dommi\Desktop\smart_finances\icons\source_icon.png' -Force

$srcImg.Dispose()
Write-Host "All icons generated successfully!"
