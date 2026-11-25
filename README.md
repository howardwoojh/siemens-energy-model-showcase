# 西门子能源模型网站

Three.js 单型号产品展示概念，参考用户视频中的产品常驻镜头、超大标题、数据面板、剖视和章节式叙事。当前版本采用紫色与白色视觉体系，共九个滚动章节。

## 为什么选择 SGT-A05

西门子能源未在产品页公开逐型号收入或年度销量，因此这里将官网的 **累计售出数量** 作为“卖得最好”的可核验代理指标。

| 当前型号 | 官网公开累计售出数量 |
| --- | ---: |
| SGT-A05 | 1,720+ |
| SGT-A35 | 900+ |
| SGT-800 | 620+ |
| SGT-400 | 450+ |
| SGT-600 | 363+ |
| SGT-700 | 142+ |

结论：在官网当前燃气轮机产品组合中，**SGT-A05 是公开累计售出数量最高的单一型号**。官网同时给出：500+ 工业客户、55 个国家、1.33 亿运行小时。

> 注意：这是基于公开累计台数的判断，不代表某一财年收入、利润或当前订单量排名。

## 运行

```bash
pnpm install
pnpm dev
```

构建：

```bash
pnpm build
```

## GitHub Pages

项目已配置为与仓库名无关的相对资源路径，并包含 `.github/workflows/deploy-pages.yml`。

1. 将本目录内容上传到 GitHub 仓库的 `main` 分支。
2. 打开仓库 `Settings → Pages`。
3. 将 `Build and deployment → Source` 设为 `GitHub Actions`。
4. 推送后等待 `Deploy to GitHub Pages` 工作流完成。
5. 使用 Pages 页面显示的网址在手机浏览器中打开。

## 交互

- 鼠标拖动：旋转模型
- 滚轮：缩放模型
- 右侧圆点或页面滚动：切换总览、完整解剖、压气机、燃烧系统、性能数据、医院热电联产、应急电源、移动供能和模块化维护九个章节
- 每章具有独立模型状态：整机展示、轴向爆炸、压气机扫描与高速叶片、燃烧脉冲、最终重新组装
- 展示模型采用无底座悬浮构图；完整解剖会把外壳、轴承、压气机级、燃烧筒、燃料环和涡轮级拆成独立零件
- 材质参考市售工业燃机/航空发动机模型：外壳为喷砂拉丝钛灰、叶片为高亮镍基合金、轴与轴承为深色氧化枪灰钢、热端为氧化棕和轻微热变色；加入程序化微表面粗糙纹理与环境反射
- 功能化特效包括压力扫描、轴向能量束、燃烧脉冲、应急启动转速爬升和场景切换冲击波
- 第 08 章加入移动电站实景视频：场景播放至能量涡轮出现后，以收束光圈和扫描溶解完成交接并露出可继续拖动、缩放的 Three.js 主模型；支持开启声音与重播部署场景
- 第 09 章按五个工程模块顺序展开整机，并用定位光环与连接扫描表现模块化维护和快速更换价值
- `剖视模式`：调整透明外壳
- `分解结构`：沿轴向分解部件
- `AUTO ORBIT`：开关自动旋转

## 官方资料

- [Siemens Energy gas turbine portfolio](https://www.siemens-energy.com/global/en/home/products-services/product-offerings/gas-turbines.html)
- [SGT-A05 product page](https://www.siemens-energy.com/global/en/home/products-services/product/sgt-a05-ae.html)
- [SGT-A35 product page](https://www.siemens-energy.com/global/en/home/products-services/product/sgt-a35.html)
- [SGT-800 product page](https://www.siemens-energy.com/global/en/home/products-services/product/sgt-800.html)

This is a design concept, not an official Siemens Energy product configurator.

## Geometry reference

The procedural geometry was revised against the official SGT-A05 poster, dedicated brochure, and gas-turbine portfolio brochure: dark inlet/boost-compressor housing, visible boost rotor, slimmer core-compressor casing, enlarged combustion/turbine casing, a complete silver exhaust diffuser casing with recessed liner and bolted annular flange, internal segmented shroud, service flange, external service lines, accessory-drive housing, casing bands, flanges, and fastener rows. It is visually closer to the official product but remains an authored approximation rather than OEM CAD.
