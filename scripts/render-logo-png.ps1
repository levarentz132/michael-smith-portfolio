Add-Type -AssemblyName System.Drawing

function Draw-CompanyLogo {
    param(
        [string]$outPath,
        [int]$width,
        [int]$height,
        [bool]$isRound = $false,
        [string]$bgColor = '#0c0d0e',
        [float]$paddingRatio = 0.22
    )

    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # 1. Background
    if ($bgColor -ne 'transparent') {
        $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($bgColor))
        if ($isRound) {
            $g.FillEllipse($bgBrush, 0, 0, $width, $height)
        } else {
            $g.FillRectangle($bgBrush, 0, 0, $width, $height)
        }
        $bgBrush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    # 2. Draw 4 logo parts
    # Logo base box dimensions: width=100, height=115
    $targetH = [float]($height * (1.0 - ($paddingRatio * 2)))
    $targetW = [float]($targetH * (100.0 / 115.0))
    if ($targetW -gt ($width * (1.0 - ($paddingRatio * 2)))) {
        $targetW = [float]($width * (1.0 - ($paddingRatio * 2)))
        $targetH = [float]($targetW * (115.0 / 100.0))
    }

    $offsetX = [float](($width - $targetW) / 2.0)
    $offsetY = [float](($height - $targetH) / 2.0)
    $scale = [float]($targetW / 100.0)

    $logoColor = [System.Drawing.ColorTranslator]::FromHtml('#F59E0B')
    $brush = New-Object System.Drawing.SolidBrush($logoColor)

    # Convert coordinates:
    # Top-Left: Arch from (6, 50) to (46, 50)
    # Box: X=6..46 (width 40), Y=6..50 (height 44)
    # Top-Left corner is rounded with diameter 80 (radius 40)
    $tlPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $tlX = $offsetX + (6.0 * $scale)
    $tlY = $offsetY + (6.0 * $scale)
    $tlW = 40.0 * $scale
    $tlH = 44.0 * $scale
    $tlPath.AddArc($tlX, $tlY, $tlW * 2, $tlH * 2, 180, 90)
    $tlPath.AddLine($tlX + $tlW, $tlY, $tlX + $tlW, $tlY + $tlH)
    $tlPath.AddLine($tlX + $tlW, $tlY + $tlH, $tlX, $tlY + $tlH)
    $tlPath.CloseFigure()
    $g.FillPath($brush, $tlPath)
    $tlPath.Dispose()

    # Top-Right: Arch from (54, 50) to (94, 50)
    # Box: X=54..94 (width 40), Y=6..50 (height 44)
    $trPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $trX = $offsetX + (54.0 * $scale)
    $trY = $offsetY + (6.0 * $scale)
    $trW = 40.0 * $scale
    $trH = 44.0 * $scale
    $trPath.AddLine($trX, $trY + $trH, $trX, $trY)
    $trPath.AddArc($trX - $trW, $trY, $trW * 2, $trH * 2, 270, 90)
    $trPath.AddLine($trX + $trW, $trY + $trH, $trX, $trY + $trH)
    $trPath.CloseFigure()
    $g.FillPath($brush, $trPath)
    $trPath.Dispose()

    # Bottom-Left: Rectangle from (6, 58) to (46, 108) (width 40, height 50)
    $blX = $offsetX + (6.0 * $scale)
    $blY = $offsetY + (58.0 * $scale)
    $blW = 40.0 * $scale
    $blH = 50.0 * $scale
    $g.FillRectangle($brush, $blX, $blY, $blW, $blH)

    # Bottom-Right: Rectangle from (54, 58) to (94, 108) (width 40, height 50)
    $brX = $offsetX + (54.0 * $scale)
    $brY = $offsetY + (58.0 * $scale)
    $brW = 40.0 * $scale
    $brH = 50.0 * $scale
    $g.FillRectangle($brush, $brX, $brY, $brW, $brH)

    $brush.Dispose()
    $g.Dispose()

    $dir = [System.IO.Path]::GetDirectoryName($outPath)
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Saved: $outPath"
}

# 1. Web public assets
Draw-CompanyLogo -outPath 'C:\highlanderstay\michael-smith-portfolio\public\logo.png' -width 512 -height 512 -isRound $false -bgColor 'transparent' -paddingRatio 0.05
Draw-CompanyLogo -outPath 'C:\highlanderstay\michael-smith-portfolio\public\favicon.png' -width 192 -height 192 -isRound $false -bgColor 'transparent' -paddingRatio 0.05
Draw-CompanyLogo -outPath 'C:\highlanderstay\OpenKos\public\assets\logo\logo.png' -width 512 -height 512 -isRound $false -bgColor 'transparent' -paddingRatio 0.05

# 2. Android mipmap icons
$densities = @(
    @{ Name = 'mdpi'; Size = 48; ForeSize = 108 },
    @{ Name = 'hdpi'; Size = 72; ForeSize = 162 },
    @{ Name = 'xhdpi'; Size = 96; ForeSize = 216 },
    @{ Name = 'xxhdpi'; Size = 144; ForeSize = 324 },
    @{ Name = 'xxxhdpi'; Size = 192; ForeSize = 432 }
)

foreach ($d in $densities) {
    $resDir = "C:\highlanderstay\michael-smith-portfolio\android\app\src\main\res\mipmap-$($d.Name)"
    Draw-CompanyLogo -outPath "$resDir\ic_launcher.png" -width $d.Size -height $d.Size -isRound $false -bgColor '#0c0d0e' -paddingRatio 0.18
    Draw-CompanyLogo -outPath "$resDir\ic_launcher_round.png" -width $d.Size -height $d.Size -isRound $true -bgColor '#0c0d0e' -paddingRatio 0.20
    Draw-CompanyLogo -outPath "$resDir\ic_launcher_foreground.png" -width $d.ForeSize -height $d.ForeSize -isRound $false -bgColor 'transparent' -paddingRatio 0.28
}

# 3. Android Splash Screens
Draw-CompanyLogo -outPath 'C:\highlanderstay\michael-smith-portfolio\android\app\src\main\res\drawable\splash.png' -width 512 -height 512 -isRound $false -bgColor 'transparent' -paddingRatio 0.25

$drawables = @('land-hdpi', 'land-mdpi', 'land-xhdpi', 'land-xxhdpi', 'land-xxxhdpi', 'port-hdpi', 'port-mdpi', 'port-xhdpi', 'port-xxhdpi', 'port-xxxhdpi')
foreach ($dr in $drawables) {
    $p = "C:\highlanderstay\michael-smith-portfolio\android\app\src\main\res\drawable-$dr\splash.png"
    if (Test-Path ([System.IO.Path]::GetDirectoryName($p))) {
        Draw-CompanyLogo -outPath $p -width 512 -height 512 -isRound $false -bgColor 'transparent' -paddingRatio 0.25
    }
}

Write-Output "All logo assets and Android launcher icons generated successfully!"
