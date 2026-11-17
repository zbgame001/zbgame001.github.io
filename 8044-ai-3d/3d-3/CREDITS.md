# Credits

- **Tiles133A** — ambientCG, CC0.
  https://ambientcg.com/view?id=Tiles133A
- **DaySkyHDRI071B** — ambientCG, CC0.
  https://ambientcg.com/view?id=DaySkyHDRI071B
- **水面贴图** —— 本仓库自己生成，无第三方许可约束。
  `assets/water/pool_water_2k.png`（2048×2048 焦散/明度图，sRGB）与
  `assets/water/pool_water_normal.jpg`（2048×2048 切线空间法线图）
  全部由 [`tools/gen_water_textures.py`](tools/gen_water_textures.py) 在本地合成，不来自任何素材站：
  高度场在频域里构造，因此横竖两个方向天然周期化（无缝、无接缝、无裁边），
  焦散由「表面把光线聚焦」的射线映射行列式 `det J = (1+d·hxx)(1+d·hyy) − (d·hxy)²` 算出，
  按 0.714 m 的水面覆盖尺寸标定网眼大小。可随时重跑脚本重新生成：
  `python3 tools/gen_water_textures.py`。
  想换回照片贴图时，注意先确认素材许可再替换同名文件（历史上用过 AITextured 的
  `water-seamless-pbr-crystal-clear-pool-water-texture`，其来源/原始许可标注为 *Not verified*，
  已因此移除）。

- **three.js r187** — MIT License.
  https://threejs.org/

贴图与 HDRI 已下载到本地 `assets/`，运行时不请求外部 CDN。
