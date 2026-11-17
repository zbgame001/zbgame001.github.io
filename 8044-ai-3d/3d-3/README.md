# Corridor

一条 256 m 长、2.4 m 宽、3.6 m 高的窄走廊，走廊地面被 1 m 深的水淹到平齐。纯场景，画面内没有文字。

相机固定在走廊正中，位置不动；按住拖动或手指滑动可以环视四周。页面本身不滚动。

## 运行

在项目根目录启动任意静态服务器：

```bash
python3 -m http.server 8901
```

打开 `http://127.0.0.1:8901/`。页面使用 ES Module 与 import map，不能直接双击 `index.html` 以 `file://` 打开。

公网预览镜像：`https://astrbot.zbgame.bid/corridor/`（nginx 直接 aliasing 到本目录，与本地同一份文件，不需要同步）。

## 操作

- 鼠标：按住左键拖动，水平转向、垂直俯仰。
- 手机/平板：在画面上滑动，水平转向、垂直俯仰。
- 视角位置固定，不能前后左右移动；没有滚轮推进或滚动条。

## 结构

```
index.html              页面、加载层、import map
css/style.css           加载层与全屏画布样式
js/main.js              three.js 场景、水面与水下光斑、加载、后期、固定视角/自适应
js/main.js.bak-water    加水之前的版本（备份，不参与运行时）
assets/textures/        Tiles133A 2K：color / normal / roughness / AO
assets/hdri/            DaySkyHDRI071B 2K Radiance .hdr
assets/water/           pool_water_2k.png（焦散/明度图）+ pool_water_normal.jpg（法线图），本地生成
tools/gen_water_textures.py  水面贴图生成脚本（频域无缝 + 射线映射焦散）
vendor/three/           three.js r187 本地 ES Module 与 addons
_downloads/             原始下载与解包素材（不参与运行时，公网已被 nginx 置为 404）
preview/                验收截图
```

## 画面实现

- 相机固定在 `(x=0, y=1.62, z=128)`，只改变 yaw / pitch；水平可 360° 环视，俯仰限制在约 ±66°。
- 2K PBR 贴图，每张纹理 12×12 块砖，砖块世界尺寸 0.3 m。
- 地面使用较粗糙的 clearcoat（0.58 / roughness 0.24），灯带在地砖上形成柔和的反射，不再是一条镜面高光轨。
- 光照：ACESFilmic、PMREM 天空 IBL、走廊内烘焙 CubeCamera 探针（单次反弹 GI）、相机前方的暖色 RectAreaLight 灯槽、半球光。
- 后期：GTAO（仅桌面高质量档）、UnrealBloom、OutputPass、FXAA、暗角/颗粒/轻调色。
- 端头是开放的天空开口，没有门框；走廊在 z=256 截断。

### 水

- 水面是一个平面网格：`2.41 m × 256 m`，高度 `y = 1.0`（水正好漫过地面 1 m）。相机眼高 1.62 m，视线只在水面上方 0.62 m —— 水线压在画面中线附近。水面材质是**不透明**的（`transparent: false`、`depthWrite: true`），水下的东西不是靠 alpha 混合透出来，而是被单独渲染一遍再采样。
- 高度只有一个数值可调：`js/main.js` 里的 `WATER.level`；`WATER.flowSpeed / normalStrength / distortion / reflectionStrength` 分别控制流动速度、波纹强度、反射扭动和反射占比。
- 波纹：三层法线贴图按不同尺度、不同方向漂移（`uvA/uvB/uvC`）叠加成坡度 `slope`，组成水面法线 `N`；Fresnel 用 `0.02 + 0.98 × (1 - N·V)^5`。
- 反射是一趟真正的平面镜 pass：把相机按水面镜像成反射相机（镜像位置、视线、up 向量），用 `y > WATER.level` 的裁剪面把水上的东西渲到半浮点 RenderTarget（桌面 0.5× 视口、上限 768×512；低档 0.34×、上限 384×512），投影矩阵烘成纹理矩阵送进水面着色器，再按波纹法线做 3 次轻微偏移采样，避免硬镜面。
- 折射是第二趟 pass：**同一台相机**、用相反的裁剪面把水面以下的地砖和下半截墙渲到 `uUnderwater` 里（桌面 0.62×、上限 1024×768；低档 0.44×、上限 512×512，清屏色 `#062f33`）。水面着色器按屏幕 UV 加 `N.xz × uRefraction` 采样这张图，RGB 三个通道再乘 1.04 / 1.00 / 0.96 做轻微色散。**瓷砖格被水波折弯就是这一层给的**，没有它水看起来只是一层青色的膜。
- 吸收与焦散：采到的水下颜色先乘 `(0.48, 0.80, 0.78)`（红光先被吃掉）再加一点深水色。焦散读的是 `pool_water_2k.png` 的亮度：按 `uvA × 14` / `uvB × 9` 采样（一张贴图盖 0.714 m 水面），取亮部做 `smoothstep(0.56, 0.92)`，**乘亮**瓷砖（光，而不是往瓷砖上刷颜色）再补一点浅水色。这张图是本地按「水面把光线聚焦」算出来的连续光网（网眼 7–14 cm、光丝约 1 cm 宽），不是照片贴图。
- 焦散乘法带亮度自适应：`gain = 1 − 0.55 × tileLum`，瓷砖越亮增益越小。地砖本来就接近白色，早期直接乘 1.26 会把亮部顶到纯白并连成片，看起来像水面上浮着一层白色泡沫——这是实际截图里暴露出来的问题，不是理论上的。
- 太阳高光 `pow(N·H, 320) × 0.24` + 闪烁 `pow(N·H, 40) × 0.035`。早期的 `180 × 1.2` 会在远处出事：法线贴图被 mip 抹平后整片水面 N·H≈1，乘 1.2 直接把大片区域点成纯白并越过 bloom 阈值 1.12，被辉光晕开成一片白。
- 最后按 `mix(floorColor, reflection, clamp(fresnel × 0.95, 0, 0.90))` 合成，加太阳高光与闪烁，再过 `#include <fog_fragment>`。
- 两趟 pass **只在视角变化或窗口尺寸变化时重渲**（`reflectionDirty` → `refreshWaterPasses()`）：相机是固定的，所以静止视角下反射与折射纹理直接复用，只有波纹和焦散在动。
- 水面材质 `fog: true`，所以必须把 `UniformsLib.fog` 的 uniform 合并进 `ShaderMaterial`——否则 `three` 在每帧刷新雾参数时会对不存在的 `uniforms.fogColor` 抛错，整个场景停在「渲染初始化失败」。

## 水的表现边界（说清楚，不假装）

- 水是**一个平面**：没有位移波，也没有水线处的泡沫、溅射或潮湿边缘。水与墙的交界是一条干净的几何交线。
- 折射是**屏幕空间**的：它采的是「同一台固定相机已经渲好的水面以下画面」，不是逐像素光线追踪。屏幕边缘会 clamp，靠近画面边界的水波折弯幅度受限；相机一旦允许移动，两趟 pass 就得每帧重渲。
- 吸收是**常量乘色**（红先衰减），不是按真实水深积分的 Beer–Lambert：1 m 和 3 m 水深在颜色上不会有区分。几何水深只体现在 `y = 1.0` 这个切割面上。
- 没有体积雾、没有水下光柱，也没有从水下往上看水面的路径（相机始终在水面之上）。
- 这是一套实时近似（平面反射 + 屏幕空间折射 + 贴图焦散 + Fresnel 合成），不是流体模拟，也不是路径追踪的水。

## 质量分级

- 默认根据视口、`devicePixelRatio`、CPU 核心数选择档位；移动端关闭 GTAO，降低 DPR、bloom 与反射贴图分辨率。
- 渲染像素有上限（低档约 3.0 MP，高档约 8.4 MP），超大屏会降低 DPR。
- 运行约 2.6 s 后按实测 FPS 自适应降档；`?low=1` 强制低档，`?fixed=1` 关闭自适应。两者仅用于诊断。

## 已验证 / 已知边界

- 已在 1024×720（高质量，含 GTAO 与水面两趟 pass）与 390×844（低质量档）实测出图：无 console 报错、无 pageerror、无 4xx 请求，`scrollY` 始终为 0，无横向溢出，加载层正常淡出。截图见 `preview/`。
- 本地 `:8901` 与公网镜像各复验一次；公网那次用禁用缓存的全新 profile 加载，确认线上拿到的就是当前文件（`?v=20261116l`）。
- 修掉过两个会让整个场景起不来的 bug：① 水面 `ShaderMaterial` 声明了 `fog: true` 却没有 fog uniform，首帧 `TypeError: Cannot read properties of undefined (reading 'value')`，停在「渲染初始化失败」；② 调试钩子 `window.__waterDebug` 里引用了 `buildCorridor()` 局部作用域的 `floorMaterial`，`ReferenceError` 直接打断初始化。另修掉一个看起来像“水面漂浮白色雾块”的问题：把 `uSunColor` 置零、把 `uCausticStrength` 置零分别出图对照，才确认那两片白分别来自被 mip 抹平的镜面高光和被顶到纯白的焦散乘法，而不是贴图本身有脏点。
- 改了 `js/main.js` 要顺手抬 `index.html` 里的 `?v=`：公网是静态文件，浏览器会拿缓存里那份旧的（曾经因此让线上看到的是已经崩掉的版本）。抬完用禁用缓存的 profile 复验一次。
- 验收用的是 headless Chromium + SwiftShader（软件光栅化），实测 0–3 fps —— 这个数字只说明软件 GL 慢，不代表真实 GPU 上的帧率；GPU 上的观感与帧率需要在有显卡的机器上复看。
- `window.__waterDebug` 是留给调试的全局钩子（暴露 water material / scene / renderer），正式站点不需要时可以直接删掉这一行。
- 加载层百分比在圆环上方、文件名在圆环下方；100% 后停留再淡出，未完成前不卸载。
- 固定在正中意味着两端各约 128 m 远：前方天空开口和后方起点墙都只是远处的小块；这是「正中固定视角」的直接结果。
- 移动端没有 GTAO；反射和折射两趟 pass 仍然跑，只是分辨率更低（0.34× / 0.44×）。没有做真实路径追踪。

## 许可

见 `CREDITS.md`。瓷砖贴图与 HDRI 为 ambientCG CC0；水面贴图由本仓库的 `tools/gen_water_textures.py` 现场生成，无第三方许可；three.js 为 MIT。
