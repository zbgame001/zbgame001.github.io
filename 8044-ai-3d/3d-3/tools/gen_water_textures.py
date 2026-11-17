#!/usr/bin/env python3
"""Generate the water textures used by the corridor scene.

Both maps are synthesised here instead of downloaded, so the project carries no
third-party licence for its water assets. Output is 2048x2048 and seamless by
construction: the fields are built in the Fourier domain, so they are exactly
periodic in both axes (no cropped edge, no blend seams).

The look targets calm indoor pool water rather than open ocean: two scales of
small ripple for the surface, and a coarse caustic net of the right physical
size for the tiles below.

Outputs (assets/water/):
  pool_water_2k.png      sRGB colour/caustic map. The water shader reads its
                         luminance for the caustic net that plays on the tiles.
  pool_water_normal.jpg  OpenGL tangent-space normal map (sRGB false).

Usage:
  python3 tools/gen_water_textures.py            # write both maps
  python3 tools/gen_water_textures.py --check    # also write preview strips to /tmp
"""

import argparse
import os

import numpy as np
from PIL import Image

N = 2048
SEED = 20261116
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'water')

# The shader samples the colour map at uvA * 14 while uvA is 0.100 per metre, so
# one colour tile covers 10 / 14 = 0.714 m of water surface. Getting this right
# is what makes the caustic cells read as centimetres instead of millimetres.
NORMAL_TILE_METRES = 1.0 / 0.100
CAUSTIC_TILE_METRES = NORMAL_TILE_METRES / 14.0


def spectral_field(n, seed, lam_min, lam_max, power, anisotropy, angle_deg):
    """Gaussian random height field, periodic over the tile.

    Amplitude follows wavelength ** power: higher power puts more energy in the
    long waves (smoother, ocean-like), lower power in the small chop.
    """
    rng = np.random.default_rng(seed)
    white = rng.standard_normal((n, n))
    spectrum = np.fft.rfft2(white)

    fy = np.fft.fftfreq(n)[:, None]          # cycles / pixel
    fx = np.fft.rfftfreq(n)[None, :]
    k = np.sqrt(fx * fx + fy * fy)
    k = np.clip(k, 1e-9, None)
    wavelength = 1.0 / k                     # pixels

    band = ((wavelength > lam_min) & (wavelength < lam_max)).astype(np.float64)
    amp = band * wavelength ** power

    # Ripples are slightly longer across the wind direction than along it.
    angle = np.arctan2(fy, fx)
    amp *= 1.0 + anisotropy * np.abs(np.cos(angle - np.radians(angle_deg))) ** 2

    height = np.fft.irfft2(spectrum * amp, s=(n, n))
    height -= height.mean()
    height /= height.std()
    return height


def periodic_gradient(field):
    """d/dy, d/dx with wrap-around, so the derived maps stay seamless too."""
    gy = (np.roll(field, -1, axis=0) - np.roll(field, 1, axis=0)) * 0.5
    gx = (np.roll(field, -1, axis=1) - np.roll(field, 1, axis=1)) * 0.5
    return gy, gx


def build_normal(target_slope=0.22):
    """Surface normal from a two-scale ripple height field.

    Amplitude goes as wavelength ** power, so the *slope* spectrum goes as
    wavelength ** (power - 1): power > 1 lets the long, slow undulation carry the
    surface and keeps the small chop as detail, which is what a calm pool looks
    like. With power < 1 the map turns into even sandpaper.
    """
    coarse = spectral_field(N, SEED, lam_min=90, lam_max=700, power=1.15,
                            anisotropy=0.55, angle_deg=18.0)
    fine = spectral_field(N, SEED + 7, lam_min=20, lam_max=90, power=1.0,
                          anisotropy=0.30, angle_deg=72.0)

    height = coarse + 0.16 * fine

    gy, gx = periodic_gradient(height)
    rms = np.sqrt(np.mean(gx * gx + gy * gy))
    slope = target_slope / max(rms, 1e-9)
    nx = -gx * slope
    ny = -gy * slope
    nz = np.ones_like(nx)
    length = np.sqrt(nx * nx + ny * ny + nz * nz)
    return np.stack([nx / length, ny / length, nz / length], axis=-1)


def blur_periodic(field, sigma):
    """Exact gaussian blur of a periodic field, done in the Fourier domain.

    Wrapping is implicit because the filter is a circular convolution, so the
    result stays seamless. A 20-40 px kernel here is what gives the caustic
    filaments a real ~1 cm width; thin ones alias into white speckle at runtime.
    """
    n0, n1 = field.shape
    fy = np.fft.fftfreq(n0)[:, None]
    fx = np.fft.rfftfreq(n1)[None, :]
    transfer = np.exp(-2.0 * (np.pi ** 2) * (sigma ** 2) * (fx * fx + fy * fy))
    return np.fft.irfft2(np.fft.rfft2(field) * transfer, s=field.shape)


def build_caustics(verbose=False):
    """Light focused by the wavy surface, via the ray-mapping determinant.

    A surface point at height h displaces the ray that reaches the floor, and the
    light piles up wherever that mapping collapses: det J -> 0, with

        det J = (1 + d*hxx)(1 + d*hyy) - (d*hxy)^2     (d = water depth)

    Deliberately built from the coarse band only. The fine band focuses light at
    millimetre spacing, which at this tiling is invisible mush; pool caustics
    read as a net of centimetre cells.
    """
    m_per_px = CAUSTIC_TILE_METRES / N
    sigma_h = 0.00055                      # surface height, metres
    depth = 1.0                            # water depth, metres

    height_px = spectral_field(N, SEED + 31, lam_min=210, lam_max=900, power=0.55,
                               anisotropy=0.25, angle_deg=41.0)
    height = height_px * sigma_h

    gy, gx = periodic_gradient(height)
    hyy, hxy_a = periodic_gradient(gy)
    hxy_b, hxx = periodic_gradient(gx)
    hxy = 0.5 * (hxy_a + hxy_b)

    # Per pixel -> per metre.
    inv = 1.0 / (m_per_px * m_per_px)
    hxx *= inv
    hyy *= inv
    hxy *= inv

    det = (1.0 + depth * hxx) * (1.0 + depth * hyy) - (depth * hxy) ** 2
    intensity = 1.0 / np.maximum(np.abs(det), 0.06)

    top = np.percentile(intensity, 98.6)
    intensity = np.clip(intensity / top, 0.0, 1.0)

    # A little prefilter: at runtime the net is seen heavily minified, and 1 px
    # filaments either alias into moire or vanish into the mip chain.
    intensity = blur_periodic(intensity, 9.0)

    if verbose:
        print(f'caustic: det<0 on {(det < 0).mean() * 100:.1f}% of pixels, '
              f'|det| p50 {np.percentile(np.abs(det), 50):.2f} p99 {np.percentile(np.abs(det), 99):.2f}')

    return intensity


def to_srgb8(caustic):
    base = np.array([0.055, 0.20, 0.235])    # deep teal, sRGB
    hot = np.array([0.95, 1.0, 1.0])         # focused light, near white
    net = caustic[..., None] ** 1.0
    rgb = base + (hot - base) * net
    return np.clip(rgb * 255.0 + 0.5, 0, 255).astype(np.uint8)


def encode_normal(normal):
    out = (normal * 0.5 + 0.5) * 255.0 + 0.5
    return np.clip(out, 0, 255).astype(np.uint8)


def seam_energy(plane, axis):
    """Mean absolute step across the wrap edge vs a typical interior step."""
    if axis == 0:
        edge = np.abs(plane[0, :] - plane[-1, :]).mean()
        inner = np.abs(np.diff(plane, axis=0)).mean()
    else:
        edge = np.abs(plane[:, 0] - plane[:, -1]).mean()
        inner = np.abs(np.diff(plane, axis=1)).mean()
    return float(edge), float(inner)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', help='write preview strips to /tmp')
    args = parser.parse_args()

    normal = build_normal()
    caustic = build_caustics(verbose=True)

    color8 = to_srgb8(caustic)
    normal8 = encode_normal(normal)

    os.makedirs(OUT_DIR, exist_ok=True)
    color_path = os.path.join(OUT_DIR, 'pool_water_2k.png')
    normal_path = os.path.join(OUT_DIR, 'pool_water_normal.jpg')

    Image.fromarray(color8, 'RGB').save(color_path, optimize=True)
    Image.fromarray(normal8, 'RGB').save(normal_path, quality=92, subsampling=0)

    lum = color8.astype(np.float64) @ np.array([0.299, 0.587, 0.114]) / 255.0
    lum_lin = np.where(lum <= 0.04045, lum / 12.92, ((lum + 0.055) / 1.055) ** 2.4)
    print(f'colour  {color_path}  {os.path.getsize(color_path)} B')
    print(f'normal  {normal_path}  {os.path.getsize(normal_path)} B')
    print(f'shader smoothstep(0.66,0.94) sees {(lum_lin > 0.66).mean() * 100:.2f}% of pixels above, '
          f'{(lum_lin > 0.92).mean() * 100:.2f}% near white')
    print(f'normal slope std  nx={normal[..., 0].std():.3f} ny={normal[..., 1].std():.3f}')
    for axis, name in ((0, 'top/bottom'), (1, 'left/right')):
        edge, inner = seam_energy(color8.astype(np.float64), axis)
        print(f'seam {name:11s} edge step {edge:.2f} vs interior {inner:.2f}')

    if args.check:
        tile = np.concatenate([color8, color8], axis=1)
        tile = np.concatenate([tile, tile], axis=0)
        Image.fromarray(tile, 'RGB').resize((1024, 1024), Image.LANCZOS).save('/tmp/water-tile-check.png')
        Image.fromarray(color8, 'RGB').resize((700, 700), Image.LANCZOS).save('/tmp/water-color-check.png')
        Image.fromarray(color8[:512, :512], 'RGB').save('/tmp/water-color-1to1.png')
        Image.fromarray(normal8, 'RGB').resize((600, 600), Image.LANCZOS).save('/tmp/water-normal-check.png')
        print('wrote /tmp/water-*.png')


if __name__ == '__main__':
    main()
