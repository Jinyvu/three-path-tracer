# 运行环境
nodejs >= 14

安装有make、g++命令（需要运行opengl）

# 使用方法
终端运行：

1. `npm install`
2. `npm run start`

# 操作
+ 开启光线追踪：点击右侧控制面板controls下的enable。开启光追后，渲染器会自动不断进行采样并与之前的结果融合。
> 光追对性能的要求较高，开启光追后可能会出现在暂时的页面卡死情况。
+ 暂停光线追踪采样：点击右侧控制面板controls下的pause。
+ 切换模型：控制面板models选择框切换
+ 切换环境贴图：
  1. background中backgroundType切换为environment
  2. environment中map选择框切换
- 控制面板其余选项说明：
  - multipleImportanceSampling：开启MIS采样
  - acesToneMapping：开启toneMapping，防止渲染结果过饱和
  - bounces：光线最大弹射次数
  - resolutionScale：默认为devicePixelRatio的倒数
  - samplesPerFrame：一帧中进行多少次采样
  - tilesX、tilesY：将屏幕分为tilesX * tilesY块，一块一块地进行渲染。可以减轻浏览器渲染的负担，防止浏览器过于卡顿。tilesX * tilesY越大，浏览器越流畅
  - env map blur：环境贴图的模糊程度
  - intensity：环境光光强
  - bgGradientTop、bgGradientBottom：backgroundType设置为Gradient时，可以指定从顶部到底部的渐变颜色