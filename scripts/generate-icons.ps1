Add-Type -AssemblyName System.Drawing

$srcLogoPath = 'C:\highlanderstay\OpenKos\public\assets\logo\logo.png'
if (-not (Test-Path $srcLogoPath)) {
    $srcLogoPath = 'C:\highlanderstay\michael-smith-portfolio\public\favicon.png'
}

Copy-Item $srcLogoPath 'C:\highlanderstay\michael-smith-portfolio\public\logo.png' -Force

$srcImg = [System.Drawing.Image]::FromFile($srcLogoPath)

function Generate-Icon {
    param(
        [string]$outPath,
        [int]$width,
        [int]$height,
        [bool]$isRound,
        [string]$bgColor = '#0c0d0e',
        [float]$scale = 0.82
    )
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($bgColor -ne 'transparent') {
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($bgColor))
        if ($isRound) {
            $g.FillEllipse($brush, 0, 0, $width, $height)
        } else {
            $rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
            $g.FillRectangle($brush, $rect)
        }
        $brush.Dispose()
    }

    $aspect = $srcImg.Width / $srcImg.Height
    $targetW = [int]($width * $scale)
    $targetH = [int]($targetW / $aspect)
    if ($targetH -gt ($height * $scale)) {
        $targetH = [int]($height * $scale)
        $targetW = [int]($targetH * $aspect)
    }

    $x = [int](($width - $targetW) / 2)
    $y = [int](($height - $targetH) / 2)

    $g.DrawImage($srcImg, $x, $y, $targetW, $targetH)
    $g.Dispose()

    $dir = [System.IO.Path]::GetDirectoryName($outPath)
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Generated: $outPath"
}

$densities = @(
    @{ Name = 'mdpi'; Size = 48; ForeSize = 108 },
    @{ Name = 'hdpi'; Size = 72; ForeSize = 162 },
    @{ Name = 'xhdpi'; Size = 96; ForeSize = 216 },
    @{ Name = 'xxhdpi'; Size = 144; ForeSize = 324 },
    @{ Name = 'xxxhdpi'; Size = 192; ForeSize = 432 }
)

foreach ($d in $densities) {
    $resDir = "C:\highlanderstay\michael-smith-portfolio\android\app\src\main\res\mipmap-$($d.Name)"
    Generate-Icon -outPath "$resDir\ic_launcher.png" -width $d.Size -height $d.Size -isRound $false -bgColor '#0c0d0e' -scale 0.8
    Generate-Icon -outPath "$resDir\ic_launcher_round.png" -width $d.Size -height $d.Size -isRound $true -bgColor '#0c0d0e' -scale 0.78
    Generate-Icon -outPath "$resDir\ic_launcher_foreground.png" -width $d.ForeSize -height $d.ForeSize -isRound $false -bgColor 'transparent' -scale 0.65
}

# Generate splash screen
$splashDir = 'C:\highlanderstay\michael-smith-portfolio\android\app\src\main\res\drawable'
Generate-Icon -outPath "$splashDir\splash.png" -width 512 -height 512 -isRound $false -bgColor 'transparent' -scale 0.75

# Splash drawables for all orientations/densities
$drawables = @('land-hdpi', 'land-mdpi', 'land-xhdpi', 'land-xxhdpi', 'land-xxxhdpi', 'port-hdpi', 'port-mdpi', 'port-xhdpi', 'port-xxhdpi', 'port-xxxhdpi')
foreach ($dr in $drawables) {
    $p = "C:\highlanderstay\michael-smith-portfolio\android\app\src\main\res\drawable-$dr\splash.png"
    if (Test-Path ([System.IO.Path]::GetDirectoryName($p))) {
        Generate-Icon -outPath $p -width 512 -height 512 -isRound $false -bgColor 'transparent' -scale 0.75
    }
}

$srcImg.Dispose()
Write-Output 'All icons and splash assets successfully generated!'
