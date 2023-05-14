# GAME202

## 1 Real-time Shadow

### 1.1 Shadow Mapping
#### 1.1.1 A 2-Pass Algorithm
+ 先从光源视角出发，生成场景的深度shadowmap，记录每个像素点的最大深度（假设深度越大离相机越近）。
+ 在从相机视角出发，渲染场景，比对每个像素的深度值是否小于shadowmap中对应的深度值，若小于则标识为阴影；若大于则正常应用光照。

#### 1.1.2 A imgae-space algorithm
直接使用提前生成好的shadowMap，不需要额外进行一次计算。

#### 1.1.3 Shadow Mapping 问题

生成shadowMap时，可能会产生一些问题：

##### 1.1.3.1 自遮挡 self occlusion

<img src="/Users/lingxin/Desktop/graphic/自遮挡问题.png" alt="自遮挡问题" style="zoom:50%;" />

可以看到原来应该是白色的地板出现了黑白相间的花纹。

<img src="/Users/lingxin/Desktop/graphic/自遮挡.png" alt="自遮挡" style="zoom:50%;" />

在生成shadowMap时，先从光源看向物体，此时物体的深度会映射为图中红色部分。假设从光源看向A点，生成了A点的深度值。当从相机视角出发，看向B点时，其在shadowMap中对应的深度是A点的，这就导致B点被遮挡。
针对这个问题，可以对shadowMap的每个深度值加上一个bias，来弥补A点到B点深度的差值，让B点对应的深度符合其真正深度。
**bias过大导致阴影缺失**
为了解决自遮挡问题引入的bias可能导致原来应该产生阴影的部分产生不了阴影。

<img src="/Users/lingxin/Desktop/graphic/bias导致阴影缺失.png" alt="bias导致阴影缺失" style="zoom:50%;" />

目前工业界没有完美的方法来解决这个问题，但学术界可以使用如下方法：

<img src="/Users/lingxin/Desktop/graphic/bias导致阴影缺失解决方法.png" alt="bias导致阴影缺失解决方法" style="zoom:50%;" />

shadowMap的每个单元不但存最大深度，还存次大深度，进行深度比较时，使用两者的平均值来比较。

##### 1.1.3.2 走样 aliasing

![shadowMapping走样](/Users/lingxin/Desktop/graphic/shadowMapping走样.png)

shadowMap分辨率问题。

### 1.2 the Math behind ShadowMap

#### 1.2.1 Approximation in RTR

在实时渲染中，会使用大量的近似方法来进行计算。

一个重要的近似：
$$
\int_\Omega f(x)g(x)dx \approx \frac{\int_\Omega f(x)dx}{\int_\Omega dx}\cdot\int_\Omega g(x)dx , 当满足以下条件时近似成立：\\
1. 积分范围较小 \\
2. g(x)具有较好的连续性
$$
对渲染方程也可以应用这个近似：
$$
L_o(p, w_o) = \int_{\Omega^+}L_i(p, w_i)f_r(p, w_i, w_o)\cos\theta_iV(p, w_i)dw_i \\
\approx \frac{\int_{\Omega^+}V(p, w_i)dw_i}{\int_{\Omega^+}dw_i}\cdot \int_{\Omega^+}L_i(p, w_i)f_r(p, w_i, w_o)\cos\theta_idw_i, \\
当满足一下条件时成立： \\
1. Small support : 点光源 、 方向光源 \\
2. Smooth integrand : 强度连续的面光源 + 漫反射表面
$$

### 1.3 Percentage closer soft shadows

使用shadowMapping可以产生硬阴影，但现实中的阴影更多的是软阴影。

<img src="/Users/lingxin/Desktop/graphic/硬阴影和软阴影.png" alt="硬阴影和软阴影" style="zoom:50%;" />

#### 1.3.1 Percentage Closer Filtering（PCF）

可以使用PCF技术来生成软阴影。

计算一个点A的阴影时，其原理是：

1. 以shadowMap上的对应点为中心选取一个n*n的区域
2. 比较点A与区域内所有点的深度大小（结果为0或1）
3. 取结果的平均值

#### 1.3.2 Percentage Closer Soft Shadows（PCSS）

计算软阴影是一个耗时的过程，所有我们希望能提前在shadowMap的每个点处有个定义改点软阴影程度的filter。

<img src="/Users/lingxin/Desktop/graphic/shadowMap软阴影filter计算.png" alt="shadowMap软阴影filter计算" style="zoom:50%;" />

如图，Light表示光源，Blocker表示遮挡物，W表示软阴影的模糊程度，则有：
$$
W_{Penumbra} = \frac{d_{Receiver}-d_{Blocker}}{d_{Blocker}}W_{Light}
$$
求软阴影shadowMap的步骤：

1. 选一个点连向点光源（面光源在此前会被处理成点光源来近似模拟），判断该点是否位于阴影中，如果是，则该点在shadowMap上的映射区域中的点是blocker。对于区域内每一个点，选取以该点为中心的一定范围区域，计算该范围内的平均Block depth作为该点的Block depth
2. 计算filter sizes（即上面公式等号左边的W）
3. 进行PCF计算

#### 1.3.3 Variance Soft Shadow Mapping

PCSS生成过程中的第一步和第三步还是进行大量的采样操作，需要大量时间。VSSM方法可以解决采样耗费大量时间的问题。

##### 1.3.3.1 **第三步解决方案**

在PCF步骤中，我们要知道A点与shadowMap上对应点的周围的n*n区域的深度大小的均值V。在VSSM中，我们将shadowMap上的深度值近似看作正态分布，那么我们只要知道区域内点深度的均值以及方差，就可以根据正态分布方程得出区域内任意点的V。

**求均值Mean**

+ mipmap
+ Summed Area Table（SAT）

**求方差Variance**

+ $$
  Var(X) = E(X^2) - E^2(X)
  $$

得到均值和方差后便可以画出正态分布图：

<img src="/Users/lingxin/Desktop/graphic/CDF.png" alt="CDF" style="zoom:50%;" />

我们要求的是深度小于某个值的概率，即为图中的阴影部分CDF(X)。

由于正态分布没有解析解，只有数值解，所以通常使用打表的方法来求解。

**Chebychev's inequality**

使用锲比科夫不等式可以简单地得到CDF，我们只需要知道均值和方差，数据也不必满足正态分布：

<img src="/Users/lingxin/Desktop/graphic/Chebychev不等式.png" alt="Chebychev不等式" style="zoom:50%;" />
$$
P(x>t) \leq \frac{\sigma^2}{\sigma^2+(t-\mu)^2},\space t>\mu时满足 \\
\sigma^2 方差, \space \mu 均值
$$

##### 1.3.3.2 **第一步解决方案**

<img src="/Users/lingxin/Desktop/graphic/PCF第一步采样.png" alt="PCF第一步采样" style="zoom:50%;" />

解法：

- 遮挡点(z < t)的平均深度：
  $$
  z_{occ}
  $$
  
- 未遮挡点(z > t)的平均深度：
  $$
  z_{unocc}
  $$
  
- 未遮挡点比例乘上其平均深度 + 遮挡点比例乘上其平均深度 = 总平均深度：
  $$
  \frac{N_1}{N}z_{unocc} + \frac{N_2}{N} = Z_{avg}
  $$
  
- 由Chebychev不等式，得：
  $$
  \frac{N_1}{N} \approx P(x > t), \\
  \frac{N_2}{N} \approx 1 - P(x > t)
  $$

- 我们不知道未遮挡点平均深度，假设：
  $$
  z_{unocc} = t
  $$

  > 如果是平面接收阴影，那么假设是合理的

如此以来，就解决了第一步中的问题。

#### 1.3.4 MIPMAP and Summed-Area Variance Shadow Maps

在Chebychev不等式中，我们希望快速结果，就需要快速获取区域的平均值和方差：
$$
P(x>t) \leq \frac{\sigma^2}{\sigma^2+(t-\mu)^2}
$$

##### 1.3.4.1 Summed Area Table（SAT）

求平均值，既可以使用mipmap，也可以使用summed area table (SAT)。

现在硬件已经可以支持快速生成mipmap了，但mipmap还是存在一定缺陷：

+ 当采样区域的边长不是2^n时，需要在两个相邻层次的mipmap上进行插值采样，不可避免地会产生误差。
+ 当采样区域不是正方形时，无法使用mipmap。

SAT方法较为适合用来求平均值。

SAT对输入的数值进行了预处理，即变输入数值，边求和：

<img src="/Users/lingxin/Desktop/graphic/SAT.png" alt="SAT" style="zoom:50%;" />

#### 1.3.5 Moment shadow mapping

VSSM中使用了Chebychev不等式来做概率分布的近似，这样出来的结果总会和实际结果有一定出入。

我们的目标是更精确地描述一个分布（但不要消耗太多资源）。

解法思路：用更高阶的矩去描述分布。

> 矩有很多定义，我们使用最简单的定义：取一个数x，用
> $$
> x, x^2. x^3, x^4, ....
> $$
> 来表示一、二、三、四阶矩。

![用矩描述某种分布](/Users/lingxin/Desktop/graphic/用矩描述某种分布.png)

MSM与VSSM很相似，不同点就是在生成shadowmap时，同时记录
$$
z, z^2, z^3, z^4
$$
然后用这些矩去描述深度的分布。

#### 1.3.6 Distance Field Soft Shdaow

![Distance Field Soft Shadows](/Users/lingxin/Desktop/graphic/Distance Field Soft Shadows.png)

Distance field空间函数：对于空间中任意一点，给出其到物体表面最近一个点的距离。

场景的Distance field（SDF）的求法：

+ 求出每个物体在空间内（对于空间中所有点）的Distance Field（这是一个三维矩阵）。
+ 对空间中某个点，求所有物体对其最小的Distance Field，此距离就是场景中该点的Distance Field的值。遍历空间中的点，即可求出场景的Distance Field。

有了SDF，我们就可以求出物体的软阴影：

<img src="/Users/lingxin/Desktop/graphic/使用Distance Field求软阴影.png" alt="使用Distance Field求软阴影" style="zoom:50%;" />

软阴影产生的原因是面光源射向其的光线有一部分被遮挡了。

如图，从着色点向面光源中心点发出一条射线，我们只要知道射线上的点距离障碍物最小的距离，即可求出未被遮挡的角度，从而计算出软阴影。

<img src="/Users/lingxin/Desktop/graphic/使用Distance Field求软阴影2.png" alt="使用Distance Field求软阴影2" style="zoom:50%;" />

得出最小距离后，计算夹角可以不使用三角函数（三角函数求解需要大量运算），而使用如下近似：
$$
min\{\frac{k \cdot SDF(p)}{|p - o|}, 1.0\}，\\
p为距离最小点，o为着色点，k为控制软阴影范围的参数
$$
软阴影的范围由k的值不同而不同：

<img src="/Users/lingxin/Desktop/graphic/k控制软阴影范围.png" alt="k控制软阴影范围" style="zoom:50%;" />

**DFSS优点**

+ 快速（不包含生成SDF）
+ 高质量

**缺点**

+ 需要进行预处理（生成SDF）
+ 需要大量存储空间

## 2 Environment Mapping

环境贴图是一张记录了从各个方向上看到的光照的贴图。

现在给到一张环境贴图，放置一个物体在场景中，不考虑任何遮挡，如何计算物体的着色。这个过程就叫Image-Based Lighting（IBL）。

在光线追踪算法中，我们是使用采样的方法进行着色，但是采样的过程比较耗时，不适合于实时渲染（现在有更先进的技术让采样在实时渲染中成为可能）。

### 2.1 The Split Sum

对于物体的BRDF，如果：

+ glossy，则采样的范围较小；
+ diffuse，则采样在一个半球中，且分布较为均匀。

<img src="/Users/lingxin/Desktop/graphic/BRDF的分布.png" alt="BRDF的分布" style="zoom:50%;" />

考虑BRDF为diffuse的情况，此时的渲染方程可以做如下近似：
$$
L_o(p,w_o) \approx \frac{\int_{\Omega_{f_r}}L_i(p,w_i)dw_i}{\int_{\Omega_{f_r}}dw_i} \cdot \int_{\Omega^+}f_r(p,w_i,w_o)\cos\theta_idw_i
$$

#### 2.1.1 近似1

观察约等式右边第一个积分：
$$
\int_{\Omega_{f_r}}L_i(p,w_i)dw_i
$$
其意义是在一个空间角范围内，将环境光积分起来。对于环境贴图，这就相当于模糊操作（filter滤波）。

<img src="/Users/lingxin/Desktop/graphic/环境贴图模糊.png" alt="环境贴图模糊" style="zoom:50%;" />

对环境贴图进行滤波后，我们在看着色：

![环境贴图的着色近似](/Users/lingxin/Desktop/graphic/环境贴图的着色近似.png)

如图，左边是正常的着色：在半球空间中采样，采样的结果用来着色。

右边是着色的近似，即我们对环境贴图滤波后：

+ 漫反射：随机方位采样一点
+ 镜面反射：直接使用反射射线打到的点（因为环境贴图已经经过了滤波操作，该点的色值是滤波范围内点色值的平均，可以用来表示镜面反射方向的着色）
+ 分别对两者应用不同权重，最终得到着色结果。

#### 2.1.2 近似2

观察越等式右边最后一个积分：
$$
\int_{\Omega^+}f_r(p,w_i,w_o)\cos\theta_idw_i
$$
我们也希望不用求积分，而直接近似得出结果。

一个容易想到的方法是预计算，但式子中有4个未知数，这就意味着预计算的范围是一个四维空间，这会占用大量空间，显然是不现实的。

那么有什么方法可以简化式子的预计算呢？

##### 2.1.2.1 微表面材质补充内容

微表面反射公式：

![微表面反射](/Users/lingxin/Desktop/graphic/微表面反射.png)

**Fresnel term**

对于其中的Fresnel term，其可以近似表示为：
$$
R(\theta) = R_0 + (1 - R_0)(1 - \cos\theta)^5, R_0为初始反射率，\theta为入射角 \\
R_0 = (\frac{n_1 - n_2}{n_1 + n_2})^2
$$
从式中可以看出，Fresnel term可以用两个参数表示——R0和θ。

<img src="/Users/lingxin/Desktop/graphic/菲涅尔项 反射率和角度.png" alt="菲涅尔项 反射率和角度" style="zoom:50%;" />

**Distribution of Normals**

我们可以用一个正态分布来近似描述微表面材质的法线分布：

<img src="/Users/lingxin/Desktop/graphic/微表面材质法线分布.png" alt="微表面材质法线分布" style="zoom:50%;" />
$$
D(h) = \frac{e^{-\frac{\tan^2\theta_h}{\alpha^2}}}{\pi\alpha^2\cos^4\theta_h}, \\
\alpha用于定义分布的胖和瘦 \\
\theta_h是与法线中线的夹角
$$
由此，我们可以做如下近似：
$$
\int_{\Omega^+}f_r(p,w_i,w_o)\cos\theta_idw_i \approx R_0\int_{\Omega^+}\frac{f_r}{F}(1-(1-\cos\theta_i)^5)\cos\theta_idw_i \\ + \int_{\Omega^+}\frac{f_r}{F}(1-\cos\theta_i)^5\cos\theta_idw_i
$$
此时，式子中只有两个参数，此时可以进行预计算，并把结果存在一张纹理中：

<img src="/Users/lingxin/Desktop/graphic/BRDF近似2.png" alt="BRDF近似2" style="zoom:50%;" />

至此，对于环境贴图，我们有了两张纹理，可以直接采样得出渲染方程的解，将原来的积分化为采样的过程就叫split sum。

### 2.2 Shadow from Environment Lighting

对于设置了环境贴图的场景，我们很难求场景的shadowMap。之前我们求shadowMap时都是针对一个光源而言，而设置了环境贴图后，我们需要考虑四面八方入射的环境光，这就相当于无数个光源，而对应的shadowMap自然就有无数张，这很明显是不现实的。

工业界的解决方案是针对某一两个最亮的光源，生成对应的shadowMap。

#### 2.2.1 Basis Functions 基函数

一个函数可以用一系列函数的线性组合来描述（参考傅立叶变换）：
$$
f(x) = \sum_ic_i\cdot B_i(x), \\
其中B_i(x)为基函数
$$

#### 2.2.2 Spherical Harmonics

Spherical Harmonices是一系列定义在二维的、定义在球表面的基函数。

![Spherical Harmonices](/Users/lingxin/Desktop/graphic/Spherical Harmonices.png)

图中是Spherical Harmonices的可视化。从中可以看到Spherical Harmonices是多个二维函数组成，这些二维函数有不同的频率，每种不同频率有多个不同的二维函数。

给定一个定义在球面的二维函数f(w)，则有：
$$
c_i = \int_\Omega f(w)B_i(w)dw
$$
求Ci的过程被成为投影。

#### 2.2.3 Precomputed Radiance Transfer (PRT)

设置了环境贴图后，渲染方程如下：

![设置了环境贴图的渲染方程](/Users/lingxin/Desktop/graphic/设置了环境贴图的渲染方程.png)

现在假设场景中其他物体不变，只有光照会发生改变，则渲染方程变化为：

![环境贴图渲染方程变化](/Users/lingxin/Desktop/graphic/环境贴图渲染方程变化.png)

+ 作一个近似（参考基函数一节）：
  $$
  L(i) \approx \sum l_iB_i(i)
  $$

+ 在我们假设的情况下，只有光源会变化，light transport是不变的，所以我们可以预先计算出light transport的值。

现在分类讨论：

+ BRDF是diffuse的情况：
  $$
  L(o) = \rho\int_\Omega L(i)V(i)max(0, n\cdot i)di \\
  \approx \rho\sum l_i\int_\Omega B_i(i)V(i)max(0, n\cdot i)di , 其中积分部分是常数 \\
  \approx \rho\sum l_iT_i
  $$

  > 这种方法的缺点是只能描述固定场景的阴影。

  对于切换光源的情况，只要预先计算好两个光源的L(o)，就可以正常切换。

  对于同一光源，但光源在场景中旋转的情况，可以将SH（Spherical Harmonics）旋转，即对SH中的基函数应用旋转。

  <img src="/Users/lingxin/Desktop/graphic/diffuse转换矩阵.png" alt="diffuse转换矩阵" style="zoom:50%;" />

+ BRDF是glossy的情况：
  $$
  L(o) = \int_\Omega L(i)V(i)\rho(i,o)max(0,n\cdot i)di \\
  L(o) \approx \sum l_iT_i(o) \\
  有T_i(0) \approx \sum t_{ij}B_j(o) \\
  所以L(o) \approx \sum(\sum l_it_{ij})B_j(o)
  $$
  ![glossy转换矩阵](/Users/lingxin/Desktop/graphic/glossy转换矩阵.png)

**PRT的局限性**

+ 只适合于低频环境贴图

  ![PRT局限-只适合低频](/Users/lingxin/Desktop/graphic/PRT局限-只适合低频.png)

+ 可以实现动态光照，但只能渲染静态场景

+ 需要进行大量预计算，占用空间较大

## 3 Real-time Global Illumination

在光线追踪一节中，我们了解了全局光照，其由直接光照和间接光照组成。直接光照比较好求，我们比较关注的是如何求出间接光照。

为了减少计算，对于间接光照，我们只考虑其反射一次的情况（反射光的点被称为次级光源）：

![一级间接光照](/Users/lingxin/Desktop/graphic/一级间接光照.png)

### 3.1 Reflective Shadow Map (RSM)

我们可以通过shadowMap找到次级光源，即shadowMap上的不是阴影的点。但即使只考虑一级间接光照，也要对shadowMap上很多点进行采样。

Reflective Shadow Map（RSM）做了一个近似：只考虑着色点附近区域内的点对着色点的影响。

<img src="/Users/lingxin/Desktop/graphic/RSM.png" alt="RSM" style="zoom:50%;" />

### 3.2 Light Propagation Volumns (LPV)

核心问题：对于任意一点，我们想知道该点处任意方向的光照（radiance）。

核心观点：沿着一条线传播，radiance是不变的。

LPV解法——将场景划分为多个空间小块，以小块作为光传播的媒介，从每个小块中发出光，想知道每个小块的接收到的radiance是多少：

1. Generation——确定空间中哪些点作为次级光源：

   用RSM方法找到场景中被直接光照照亮的表面，从其中选择一些（可以使用采样方法）作为次级光源

2. Injection——将次级光源按空间位置分布，注入到不同的小块中：

   用一个三维的纹理划分空间。对于每个小格，统计其在空间上不同方向上的光照分布。使用SH来表示空间上光照的分布（通常只使用前两阶）。

   <img src="/Users/lingxin/Desktop/graphic/LPV_injection_SH.png" alt="LPV_injection_SH" style="zoom:50%;" />

3. Propagation——从包含有次级光源的小块为起点，让光线在划分后的空间传播

   对于每个格子，统计其传播到空间上相邻的6个格子的radiance：

   <img src="/Users/lingxin/Desktop/graphic/LPV_Propagation.png" alt="LPV_Propagation" style="zoom:50%;" />

   然后对每个格子进行迭代，最后可以得出所有格子在空间各个方向上的radiance。

4. Rendering——如此以来，就知道了某一小块在任意方向的radiance，渲染场景

**问题**

格子A和相邻格子B之间被障碍挡住，现实中光线不可能从A传播到B，但LPV还是计算了A、B之间的相互影响。

### 3.3 Voxel Global Illumination (VXGI)

VXGI与RSM的区别——RSM中的次级光源是每个像素所表示的小片，VXGI中的场景全部被离散化成了网格：

<img src="/Users/lingxin/Desktop/graphic/VXGI网格化场景.png" alt="VXGI网格化场景" style="zoom:50%;" />

> VXGI划分的网格是树形结构的，在大格子里包含小格子。

VXGI步骤：

1. 划分场景

2. 确定场景中的次级光源，并将其注入到格子里。与LPV不同的是，VXGI中每个格子记录的是光源输入方向的大致分布以及反射表面法线的大致分布：

   <img src="/Users/lingxin/Desktop/graphic/VXGI_格子记录.png" alt="VXGI_格子记录" style="zoom:50%;" />

3. 根据着色点的材质，从着色点“发射出一个圆锥”（如果是glossy材质，圆锥就比较尖；如果是diffuse材质，则可以使用多个较尖的圆锥来表示），计算圆锥覆盖范围内的格子对着色的影响。（随着圆锥的传播，其会越来越大，此时只需要计算与圆锥底面面积最相近的层级的格子）。

   <img src="/Users/lingxin/Desktop/graphic/VXGI_圆锥追踪.png" alt="VXGI_圆锥追踪" style="zoom:50%;" />

### 3.4 Screen Space Ambient Occlusion

之前三个方法是在图像空间下实现全局光照的方法，接下来介绍屏幕空间的方法。

![环境光遮蔽](/Users/lingxin/Desktop/graphic/环境光遮蔽.png)

上图中，左边是启用了环境光遮蔽，右边则没有。从图中可以直观地了解到，环境光遮蔽为物体与物体之间接近的部分添加了阴影，让物体的位置更加明显。环境光遮蔽其实就是对全局光照的一个近似。

（假设是diffuse材质）在Blinn-Phong模型中，我们假设物体有一个底色，即环境光。在环境光遮蔽中，我们还是假设环境中存在各个方向都一样的光，但不是每个着色点都能接收到环境光。

对于环境光，渲染方程：
$$
L_o(p, w_o) = \int_{\Omega^+}L_i(p,w_i)f_r(p,w_i,w_o)V(p,w_i)\cos\theta_idw_i \\
= \frac{\rho}{\pi}L_i(p)\cdot \int_{\Omega^+}V(p,w_i)\cos\theta_idw_i
$$
SSAO：

1. 对于每个着色点，在其周围一定范围内选取几个点
2. 将选取的点投影到相机视角下，比较选中的点的深度和相机记录的投影点的深度。若选中点的深度大于投影点的深度，则表示该点被挡住。
3. 考虑选中点被遮挡的个数，若小于一半（实际场景中，一个点只能接收来自半球的光线），则着色点使用正常的环境光；若大于一半，让环境光乘以半球（着色点法线所在半球）内未被遮挡点所占百分比。

![SSAO](/Users/lingxin/Desktop/graphic/SSAO.png)

### 3.5 Screen Space Directional Occlusion

![SSDO](/Users/lingxin/Desktop/graphic/SSDO.png)

SSDO与光线追踪有点类似：

+ 从着色点P随机射出一条光线
+ 如果光线没有打到物体，则应用环境光照
+ 如果打到了物体，则应用间接光照

> SSDO刚好与SSAO相反

<img src="/Users/lingxin/Desktop/graphic/SSDO采样.png" alt="SSDO采样" style="zoom:50%;" />

SSDO与SSAO采样过程类似，不同的是SSDO选取被遮挡的点（图中的A、B、D），将被遮挡点映射到物体表面的点看作次级光源，计算这些点对着色点的影响。

### 3.6 Screen Space Reflection

SSR的两个基本任务：

+ intersection：求任意光线与场景（其实是从相机视角下看到的场景的一层壳）的交点
+ shading：交点对着色点的影响

SSR的基本思路：

![SSR思路](/Users/lingxin/Desktop/graphic/SSR思路.png)

对于求交步骤，假设从相机发出射线并在着色点反射，我们想要快速求出反射射线与场景壳的交点。我们假设射线每次前进一定的步数，每次前进都判断其是否与场景壳相交。但这样做可能会由于步幅过大而导致射线直接穿过壳。

<img src="/Users/lingxin/Desktop/graphic/SSR场景求交.png" alt="SSR场景求交" style="zoom:50%;" />

为了快速求出交点，我们使用动态步幅的方法：

1. 先求场景壳的mipmap（每上一层，一个像素点表示的是下一层对应范围内像素点的最小深度值）。![SSR场景壳mipmap](/Users/lingxin/Desktop/graphic/SSR场景壳mipmap.png)

2. 求交：

   ```
   mip = 0;
   while(level > -1){	// level是mipmap的层数
   	step through current cell;
   	if(above Z plane) ++level;
   	if(below Z plane) --level;
   }
   ```

   <img src="/Users/lingxin/Desktop/graphic/SSR求交.png" alt="SSR求交" style="zoom:50%;" />

   从反射点发出射线，先前进一格。如果没有交点，则前进2格......假设现在前进n格，如果有交点，判断交点位于前进区间的左半边还是右半边，在对应的半边前进n/2格，继续判断有无交点。如此，最终可以快速得出交点。

**局限性**：

+ 只能反射屏幕上看到的部分；
+ 当被反射物体超出屏幕时，反射部分会出现锐利的边界（不能反射屏幕外的物体）

## 4 Real-Time Physically-Based Materials

### 4.1 Microfacet BRDF

微表面材质在宏观看上去是平整的，但微观上有着不同方向的发现分布，导致从不同方向看上去呈现不同样貌。

![微表面材质](/Users/lingxin/Desktop/graphic/微表面材质.png)

微表面材质反射遵循如下等式：
$$
f(i,o) = \frac{F(i,h)G(i,o,h)D(h)}{4(n,i)(n,o)} \\
F为Fresnel term，G为shadowing-masking term，D为法线分布
$$

#### 4.1.1 Fresnel term

菲涅尔项用于表示射到表面的光有多少会被反射，其可近似被表示为：
$$
R(\theta) = R_0 + (1 - R_0)(1 - \cos\theta)^5, R_0为初始反射率，\theta为入射角 \\
R_0 = (\frac{n_1 - n_2}{n_1 + n_2})^2
$$

#### 4.1.2 Normal Distribution Function

NDF用于描述材质表面的法线分布情况。

用于描述NDF的模型：

+ Beckmann，GGX，。。。

##### 4.1.2.1 Beckmann NDF

$$
D(h) = \frac{e^{-\frac{\tan^2\theta_h}{\alpha^2}}}{\pi\alpha^2\cos^4\theta_h} \\
h表示半球上任何一个方向，D(h)就是h方向上的法线方向 \\
\alpha表示表面的粗糙程度 \\
\theta_h表示h和对应处法线的夹角
$$

##### 4.1.2.2 GGX NDF

Beckmann与GGX对比：

![Beckmann与GGX对比](/Users/lingxin/Desktop/graphic/Beckmann与GGX对比.png)

如下图所示，n 表示物体表面宏观法线方向，也就是我们通常在渲染中用到的物体表面法线方向。m 表示看不见的微小平面的法线方向。函数 D 正是描述了 m 的分布情况。不同的 m 的分布，造成了物体表面不同程度的粗糙度：

![GGX表面](/Users/lingxin/Desktop/graphic/GGX表面.png)
$$
D(m) = \frac{\alpha^2\chi^+(m\cdot n)}{\pi\cos^4\theta_m(\alpha^2+\tan^2\theta_m)^2} \\
θm 表示 m 与n 之间的夹角, \alpha表示控制变量,\\ \chi^+(\alpha)表示表示阶跃函数，当 α > 0 时取值 1，当 α ≤ 0 取值 0
$$
**GTR**

GTR是GGX的升级版，其可以通过添加控制参数来控制NDF的衰减程度：

![GTR](/Users/lingxin/Desktop/graphic/GTR.png)

#### 4.1.3 Shadowing-Masking Term

由于微表面材质是凹凸不平的，所以可能产生自遮挡现象，Shadowing-Masking Term就是用来描述微表面shadowing和masking的，效果是让图像变暗。

shadowing：光射向微表面，微表面产生自遮挡现象

<img src="/Users/lingxin/Desktop/graphic/微表面shadowing.png" alt="微表面shadowing" style="zoom:50%;" />

masking：微表面反射的光有部分被自身遮挡

<img src="/Users/lingxin/Desktop/graphic/微表面masking.png" alt="微表面masking" style="zoom:50%;" />

观察微表面反射方程：
$$
f(i,o) = \frac{F(i,h)G(i,o,h)D(h)}{4(n,i)(n,o)}
$$
我们发现在n和i接近垂直时，f的值会接近无限大，即在物体边缘会出现明亮的白光。我们将这种情况下n与i的夹角称为grazing angle，shadowing-masking term就是用来在grazing angle下将物体变暗的。

![gazing angle](/Users/lingxin/Desktop/graphic/gazing angle.png)

##### 4.1.3.1 Smith Shadowing-Masking Term

这种将shadowing和masking看作不相互影响的两项，分别计算：
$$
G(i,o,m) \approx G_1(i,m)G_2(o,m)
$$
![Smith SMT](/Users/lingxin/Desktop/graphic/Smith SMT.png)

图中红线时Beckmann NDF，绿线是GGX NDF。

#### 4.1.4 微表面补正

在确定了前面三项后，我们可以计算微表面着色，得出的结果如下所示：

![微表面能量损失](/Users/lingxin/Desktop/graphic/微表面能量损失.png)

从中我们发现，随着材质粗糙程度增大，材质表现得越来越暗。

这种现象的原因是我们只考虑了一次反射：对于粗糙表面，光线在反射后容易被表面自身挡住，发生多次反射。而我们只考虑一次反射，将多次反射的能量忽略，从而产生能量损失，导致表面变暗。

##### 4.1.4.1 The Kulla-Conty Approximation

假设从任意方向入射的radiance都是1，这样反射的总能量就是1。计算反射一次光线的能量：
$$
E(\mu_o) = \int^{2\pi}_0\int^1_0f(\mu_o,\mu_i,\phi)\mu_id\mu_id\phi \\
其中o为观察的方向， i为入射方向 \\
上面的式子做了一个换元: \mu = \sin\theta
$$
那么，从o方向观察，损失的能量就是：
$$
1 - E(\mu_o)
$$
Kulla-Conty的基本思想就是补上损失的能量。

为了希望能补上这些能量，Kulla-Conty希望额外计算另外一种BRDF，对它积分出来的能量等于损失的能量。考虑BRDF的对称性，可以假设BRDF的形式如下：
$$
c(1-E(\mu_i)(1-E(\mu_o))) \\
c是为了让BRDF积分等于损失的能量而添加的常数
$$

这里直接给出c的值：
$$
c = \frac{1}{\pi(1-E_{avg})}, \\
E_{avg} = 2\int^1_0E(\mu)\mu d\mu
$$
对于Eavg，我们用预计算的方法求其值。Eavg只依赖与两个参数：
$$
\mu_o 和 粗糙度roughness
$$
则通过对这两个参数打表，我们得到如下一张纹理：

<img src="/Users/lingxin/Desktop/graphic/Kulla-Conty Eavg纹理.png" alt="Kulla-Conty Eavg纹理" style="zoom:50%;" />

经过上面操作，我们可以得到无能量损失的结果：

![Kulla-Conty应用结果](/Users/lingxin/Desktop/graphic/Kulla-Conty应用结果.png)

**对于有颜色的BRDF**

颜色的产生是因为材质对不同频率光的吸收程度不同，所以有颜色就代表有能量损失。

Kulla-Conty方法对于有颜色的BRDF，思路是：先考虑没有颜色的情况，然后再考虑由于能量吸收而造成最终颜色是什么。

我们定义一个平均Frensel term，表示不论入射方向是怎样，平均有百分之几的能量被反射：
$$
F_{avg} = \frac{\int^1_0F(\mu)\mu d\mu}{\int^1_0\mu d\mu} = 2\int^1_0F(\mu)\mu d\mu
$$

$$
反射一次的能量：F_{avg}E_{avg} \\
反射两次的能量：F_{avg}(1-E_{avg})\cdot F_{avg}E_{avg} \\
... \\
反射k次的能量：F^k_{avg}(1-E_{avg})^k\cdot F_{avg}E_{avg} \\
\\
对上面式子求和，得到颜色项color\space term：\frac{F_{avg}E_{avg}}{1-F_{avg}(1-E_{avg})}
$$

最后将之前不考虑颜色得到的结果乘上color term，就可以得到最终的结果。

![Kulla-Conty处理带颜色的材质](/Users/lingxin/Desktop/graphic/Kulla-Conty处理带颜色的材质.png)

#### 4.1.5 Linearly Transformed Cosines

LTC是一种用于着色微表面的方法，其目的是快速计算出着色点在一个给定的多边形光源下的着色。

> LTC不考虑阴影的生成。

![LTC](/Users/lingxin/Desktop/graphic/LTC.png)

> 我们使用lobe来描述图中蓝色部分的形状（类似花瓣的形状）

LTC：

+ 可以找到一种变换，将lobe转变为用余弦函数表示的形式。

  ![LTC lobe到余弦](/Users/lingxin/Desktop/graphic/LTC lobe到余弦.png)

  > 图中左边为lobe，右边为余弦函数

+ 对于光源，我们也可以将其转变为余弦函数表示的形式（可以将图中的红色矩形看作光源）

+ 经过前面两步，原来求解较困难的BRDF积分就被转为在余弦函数上的积分，这是有解析解的。

假设BRDF经过M变换可以转化为余弦函数表示形式：

![BRDF余弦变换](/Users/lingxin/Desktop/graphic/BRDF余弦变换.png)

则有：
$$
- \space BRDF \longrightarrow^{M^{-1}} Cosine \\
- \space Direction: w_i\longrightarrow^{M^{-1}}w_i' \\
- \space 积分域: P\longrightarrow^{M^{-1}}P' \\

其中方向的变化可以写成：w_i = \frac{Mw_i'}{\lVert Mw_i'\rVert}
$$
对于渲染方程：
$$
L(w_o) = L_i\cdot\int_PF(w_i)dw_i, \space 假设光源各个方向radiance相同 \\
= L_i\cdot\int_P\cos(w_i')d\frac{Mw_i'}{\lVert Mw_i'\rVert} \\
= L_i\cdot\int_{P'}\cos(w_i')Jdw_i'
$$

### 4.2 Disney's Principled BRDF

Disney原则材质是一种对艺术家友好的材质，其用几个通俗的参数（roughness、metalness。。。）来控制材质呈现出不同效果。它使用单一模型就可以描述很多中不同的材质。

> Disney原则材质不是PBR

## 5 Non-Photorealistic Rendering

NPR非真实感渲染，其目的是达到一种stylization风格化渲染的效果。

**Photorealistic Rendering**——目的是达到与真实照片一样的效果。

NPR的思路：

+ 先得到真实的渲染结果
+ 将真实渲染结果变得抽象
+ 增强风格

<img src="/Users/lingxin/Desktop/graphic/NPR.png" alt="NPR" style="zoom: 25%;" />

### 5.1 Outline Rendering

先明确Outline的定义：

<img src="/Users/lingxin/Desktop/graphic/Outline Rendering.png" alt="Outline Rendering" style="zoom:50%;" />

- [B]oundary 边界
- [C]rease 折痕
- [M]aterial edge 材质的边界
- [S]ilhouette edge 属于物体的边界，且由多个面共享

#### 5.1.1 Shading

**Shading normal contour edge**

根据相机与物体上的点的法向量的夹角来判断该点是否属于边界。我们可以指定一个阈值，比如大于89度、大于80度的就是边界，这样就可以得到边界图像：

![NPR根据法向量确定边界](/Users/lingxin/Desktop/graphic/NPR根据法向量确定边界.png)

这种方法会导致生成的边界粗细不一致。

**Backface fattening**

渲染模型时，我们可以分辨前面和背面，对于背面的三角形，我们将其扩大一圈，且将其渲染为指定的边界颜色，这样渲染结果中，整个模型就好像被边界包裹起来了。

<img src="/Users/lingxin/Desktop/graphic/NPR backface fattening.png" alt="NPR backface fattening" style="zoom:50%;" />

**Edge detection in image**

输入是一张图像，根据图像找出边界。

+ 使用Sobel detector，即对图像每个像素，在其周围一定范围区域内应用一个矩阵，这样可以让图像边界变明显：

  ![sobel detecor强调边界](/Users/lingxin/Desktop/graphic/sobel detecor强调边界.png)

+ 结合渲染时生成的各种图像（法线贴图、深度图。。。）来生成边界：

  ![根据法线、深度图生成边界](/Users/lingxin/Desktop/graphic/根据法线、深度图生成边界.png)

  图中从左起，第一张是法线图，第二张是深度图，第三张是边界图

### 5.2 Color Blocks

在卡通渲染中，我们希望得到有大块色块的图：

![NPR color blocks](/Users/lingxin/Desktop/graphic/NPR color blocks.png)

实现的思路就是设置几个阈值，落在阈值区间内的亮度全部应用一个设定好的亮度（这种处理又称为量化）。实现的方法有两种：

+ 在shading的过程中判断
+ 对最后生成的图像进行判断

### 5.3 Strokes Surface Stylization

即素描风格的图像：

<img src="/Users/lingxin/Desktop/graphic/Strokes Surface Stylization.png" alt="Strokes Surface Stylization" style="zoom:50%;" />

实现的基本思想：用预设好的笔触纹理替换掉原来的点。

实现明暗效果：

+ 先预设几张对应不同亮度的纹理
+ 根据点的shading查找对应的贴图进行替换

对于素描画，不管物体距离相机多远，其亮度始终不变。但是当模型远离相机时，其点会越来越密集，用纹理替换点后会产生模型变暗的效果。解决的方法：

+ 对每个纹理生成mipmap
+ 根据点离相机的远近选择对应纹理的对应mipmap进行替换

![Strokes Surface Stylization Maps](/Users/lingxin/Desktop/graphic/Strokes Surface Stylization Maps.png)

## 6 Real-Time Ray Tracing

在了解RTRT是做什么之前，我们先了解下光线追踪在做什么。

![SPP](/Users/lingxin/Desktop/graphic/SPP.png)

概念：1SPP = 1 sample per pixel
$$
1 SPP = 1\space rasterization(primary) + \\
1\space ray(primary\space visiblity) + \\
1\space ray(secondary\space bounce) + \\
1\space ray(secondary\space vis.)
$$
1SPP包含：

+ 直接采样光源的射线
+ 判断着色点到光源中间是否有遮挡的射线
+ 二次弹射的射线
+ 判断二次弹射着色点到光源中间是否有遮挡的射线

> 直接采样光源的射线等价于直接对场景进行光栅化，所以在工业界，都是先对场景进行光栅化，再做剩下三次射线求交的计算

而现在有硬件可以做到完成1SPP的计算，RTRT所做的是降噪处理。

工业界降噪的方法是滤波，有点类似H.264编码：

+ 在时间上，对于当前帧（假设帧与帧之间是连续的），记录其像素点相对于上一帧对应像素点的位移，该点结果可以复用上一帧已经降噪好的结果。
+ 空间上？

**Geometry Buffer**

我们在渲染场景时，可以免费得到一些额外的信息（per pixel depth, normal, world coordinate, etc.），这些就叫G-buffer。

![G-buffer](/Users/lingxin/Desktop/graphic/G-buffer.png)

> G-buffer是屏幕坐标系下的

### 6.1 Back Projection

Back Projection是一种在时间上（temporal）降噪的方法，其思想是使用上一帧已经降噪好的图像来为当前帧渲染的参考。

对于物体上某点A

+ 在第i-1帧上，在屏幕上显示A的像素是S'；
+ 在第i帧上，在屏幕上显示A的像素是S；
+ 从S'到S的变换即motion vectors

![Back Projection](/Users/lingxin/Desktop/graphic/Back Projection.png)

找到映射的具体实现：

+ 在渲染的过程中，我们可以得到每个点对应的世界坐标s；

+ 那么我们就知道从上一帧世界坐标s'到当前帧世界坐标s的变换：
  $$
  s' \longrightarrow^T s \\
  s \longrightarrow^{T^{-1}} s'
  $$

+ 则我们可以求出上一帧点对应的像素：
  $$
  x' = E'P'V'M's' \\
  E'视口变换， P'投影变换，V'相机变换，M'模型变换
  $$

找到了映射，我们就可以求像素点的着色了：

+ 先对上一帧降噪（如果上一帧不是I帧，则不用降噪）

+ 当前帧像素着色：
  $$
  C_i = \alpha C_i + (1-\alpha)C_{i-1} \\
  一般来说，0.1 < \alpha < 0.2
  $$

**局限性**：

+ 当场景突然切换，无法复用上一帧图像
+ 上一帧被遮挡的物体在当前帧出现，会出现“拖影”现象

**改进方法**

+ Clamping

  将上一帧图像拉到与当前帧图像近似的颜色（计算像素点周围区域的均值和方差，据此确定一个合理的色值区间，将上一帧图像clamp到区间内），再着色

+ Detection

  对场景中的物体标上ID，如果当前帧物体ID与映射到的上一帧的物体ID相同，则可以复用上一帧；若不同，则可以调整$\alpha$，减小上一帧的占比。

> 这些改进方法重新引入了噪声

### 6.2 Implmentation of Filtering

对于在空间上（spatial）进行降噪，我们可以对图像做滤波，我们想要保留低频的信息，将高频的噪声去除。

<img src="/Users/lingxin/Desktop/graphic/滤波.png" alt="滤波" style="zoom:50%;" />

滤波定义：输入一个带有噪声的图片，输出滤波后的图像：
$$
\tilde{C} \longrightarrow^{filter} \bar{C}
$$

#### 6.2.1 Gaussian filter高斯滤波

假设我们要对i点（i是2D图像上的点）进行滤波，则i附近的j点的贡献可以通过高斯滤波函数查到（计算i与j的距离，从图像中可以找到对应距离的贡献值）：

<img src="/Users/lingxin/Desktop/graphic/Gaussian filter.png" alt="Gaussian filter" style="zoom:50%;" />

```
For each pixel i
	sum_of_weights = sum_of_weighted_values = 0.0
	For each pixel j around i
		Calculate the weight w_ij = G(|i - j|, sigma)
		sum_of_weighted_values += w_ij * C^{input}[j]
		sum_of_weights += w_ij
	C^{output}[I] = sum_of_weighted_values / sum_of_weights
```

#### 6.2.2 Bilateral Filtering

用高斯滤波处理图像，会导致图像的边界变得模糊。Bilateral Filtering双边滤波保证边界不被模糊。

> 在计算机中，我们定义颜色变化剧烈的区域为边界

Bilateral Filtering思想：

+ 对于颜色变化不激烈的区域，仍然使用高斯滤波；
+ 对于颜色变化激烈的区域，减少j点的权重值。

公式：
$$
w(i,j,k,l) = exp(-\frac{(i-k)^2+(j-l)^2}{2\sigma_d^2} - \frac{\lVert I(i,j)-I(k,l) \rVert^2}{2\sigma_r^2}) \\
(i,j)是一个点，(k,l)是一个点 \\
I表示点的色值
$$

#### 6.2.4 Joint Bilateral Filtering

高斯滤波：使用点与点之间的距离来决定权重；

双边滤波：使用点与点距离+点与点色值差距来决定权重；

那么我们可以自然地想到使用更多的标准metrics（世界坐标、法线。。。）来决定权重。

对于描述权重的函数，我们也不一定要使用高斯函数，只要是能够随着距离衰减的函数都可以作为权重函数。

### 6.3 Implementing Large Filters

当我们滤波范围较小时，我们可以快速得到结果，但如果滤波的范围很大时，求解的速度就会变慢。

下面介绍两种解法：

#### 6.3.1 Separate Passes

假设滤波范围是N * N。

+ 先水平做一遍滤波（N * 1）
+ 在水平滤波后的图像上再做一遍竖直滤波，得到最终结果

如此操作，时间复杂度由N*N变为2N。

![Separate Passes](/Users/lingxin/Desktop/graphic/Separate Passes.png)

#### 6.3.2 Progressively Growing Sizes

逐步增大filter，来做滤波。

以a-trous wavelet举例：

+ 每次都是5 * 5的范围进行filter
+ 但每次选取点的间隔都是2^i

![a-trous wavelet](/Users/lingxin/Desktop/graphic/a-trous wavelet.png)

如果滤波5次，则每个点间距为16，16\*4 = 64，表示64\*64范围的滤波。

**为什么要增长尺寸？**——应用更大范围的滤波=过滤更低频的信息。

**为什么跳着采样合理？**

![Progressively Growing Sizes合理性](/Users/lingxin/Desktop/graphic/Progressively Growing Sizes合理性.png)

如图，看左边图，第一次滤波过滤的是蓝色部分，即高频的信息。第二次滤波过滤的是黄色部分，即更低频的信息。如此，增加滤波尺寸其实就是不断过滤掉高频信息的过程，只留下低频的信息。

看右边部分，第一次滤波后，剩下蓝色部分。第二次滤波将间隔扩大一倍，相当于将蓝色部分扩大一倍，即图中黄色部分。第二次滤波相当于在黄色范围内进行采样。

### 6.4 Outlier Removal

有时候经过1SSP计算后，我们可能得到有很多亮点（outlier）的图。此时再使用滤波方法处理图片可能导致亮点扩散到周围。

![Outlier Removal问题提出](/Users/lingxin/Desktop/graphic/Outlier Removal问题提出.png)

判断点是否是outlier：

+ 对每个像素，查看其周围一定范围，比如7\*7

+ 计算该区域内的均值$\mu$和方差$\sigma$

+ 如果该像素不在如下范围区间内，则该像素为outlier
  $$
  [\mu-k\sigma,\mu+k\sigma]
  $$

+ 

检测出outlier后，将outlier约束（clamp）到上面的区间。

### 6.5 Spatiotemporal Variance-Guided Filtering

SVGF使用3个因子影响滤波：

**Depth**
$$
w_z = exp(-\frac{\lvert z(p)-z(q) \rvert}{\sigma_z\lvert \nabla z(p)\cdot (p-q)+\varepsilon \rvert}) \\
z(p)表示p点深度
$$
**Normal**
$$
w_n = max(0, n(p)\cdot n(q))^{\sigma_n} \\
n(p)表示p点法线
$$
**Luminance**
$$
w_l = exp(-\frac{\lvert l_i(p)-l_i(q) \rvert}{\sigma_l\sqrt{g_{3\times3}(Var(l_i(p)))} + \varepsilon}) \\
l_i(p)为p点第i帧的亮度 \\
Var(l_i(p))为p点周围亮度的方差
$$
上式中$g_{3\times3}$的计算方式如下：

1. 计算p点周围7\*7的方差
2. 计算p点最近几帧（p点对应的像素）方差的平均
3. 再选取周围3\*3区域的取平均

### 6.6 Recurrent AutoEncoder

使用名为Recurrent denoise AutoEncoder的神经网络去对SSP结果做滤波。

## 7 Practical Industrial solutions

### 7.1 Temporal Anti-Aliasing

TAA的思路与RTRT中的Back Projection几乎相同，就是想方法复用上一帧的样本。

TAA的Sampling pattern是：

<img src="/Users/lingxin/Desktop/graphic/TAA采样模式.png" alt="TAA采样模式" style="zoom:50%;" />

如图，屏幕被划分为一个个格子，每个格子内有四个颜色不同（橙、黄、红、绿）的点。对于某一个格子，假设当前帧其采样点为橙色点，则下一帧采样点为黄色、再下一帧是红色，再下一帧是绿色，再下一帧是橙色……当前帧像素点着色时，找到上一帧对应的采样点作为参考。

**其他反走样方法**

+ SSAA（super sampling AA）：先以一个高分辨率渲染场景，之后再把分辨率降下来

+ MSAA（multi sample AA）：是SSAA的优化。

  + 对于同一个三角形上的不同采样点，只做一次shading

    ![MSAA原理1](/Users/lingxin/Desktop/graphic/MSAA原理1.png)

    如图右边，选取了四个采样点，但真正着色的是图中的两个绿色点，左边的绿色点位置是三个采样点的某种平均。

  + 如果采样点位于两个采样区域边界，则两个采样区域可以复用这个采样点。

    <img src="/Users/lingxin/Desktop/graphic/MSAA原理2.png" alt="MSAA原理2" style="zoom:50%;" />

    如图，(1)和(2)边界上的两个采样点可以同时为(1)和(2)使用。

+ SMAA（Enhanced subpixel AA）：将图像矢量化，根据边界计算边界上各个像素的贡献。

  ![SMAA](/Users/lingxin/Desktop/graphic/SMAA.png)

### 7.2 Temporal Super Resolution

Super Resolution可以理解为提升分辨率。

**DLSS1**

使用神经网络，针对某种场景大量训练，由神经网络猜测出高分辨率的图。

**DLSS2**

复用上一帧的结果来提升分辨率。

DLSS2面临的一个主要问题是：上一帧的结果也是低分辨率的，如果直接进行插值，算出来的就会与周围像素着色相近，从结果上看就是图像会变得模糊。如何合理使用上一帧的结果？

DLSS2中采用信号拟合的方法来解决。

![DLSS2信号拟合](/Users/lingxin/Desktop/graphic/DLSS2信号拟合.png)

如图，绿色是当前帧的信号，蓝色是上一帧的信号。图中的点是采样点，我们希望从左边采样点稀疏转到右边采样点密集，且采样点要尽量与当前信号拟合。DLSS2的神经网络输出的就是如何使用上一帧的采样点，来实现信号拟合。

### 7.3 Deferred Shading

Deferred Shading延迟渲染是一个让shading变得更快的思路。

在计算shading时，有些fragment即使通过了深度测试，之后也可能被其他frament挡住，会被计算着色两次，deferred shading就是这种现象的解决方案。

Deferred Shading思路——场景光栅化两次：

1. 不做shading，任何fragment只用来做深度的更新，存到一个深度缓冲区中；
2. 再做一次正常的光栅化，这次通过深度测试的fragment就都是能够被看到的。

### 7.4 Tiled Shading

Tiled Shading是Deferred Shading的提高，它将屏幕分为多块，分块做shading。通过这样的方法，可以减少每个小块要考虑的光源数量。

<img src="/Users/lingxin/Desktop/graphic/tile shading.png" alt="tile shading" style="zoom:50%;" />

> 我们假设每个光源都有一定的辐射范围，则场景中的光源就像一个个球体，此时将场景分块就可以减少要考虑光源的数量

**Clustered Shading**

在tiled shading的基础上，再对深度进行划分。

<img src="/Users/lingxin/Desktop/graphic/clustered shading.png" alt="clustered shading" style="zoom:50%;" />

### 7.5 Level of Detail Solutions

LoD指的是mipmap的层级。选用正确的层级以达到计算量最小的效果。

Cascaded思路是指在不同的情况下选用不同的层级使用。

例子：

+ cascaded shadow map：对于离相机近的物体，我们使用精细度高的shadow map；对于离相机远的，使用精细度低的。

  <img src="/Users/lingxin/Desktop/graphic/cascaded shadow map.png" alt="cascaded shadow map" style="zoom: 33%;" />

  图中红色框是精细度高的shadow map，蓝色框是精细度低的shadow map。可以看到红色、蓝色有一部分重叠的部分，这是为了保证过渡的平滑，这部分区域会使用两种不同精细度shadowMap的插值。

+ cascaded LPV：随着光传播距离的逐渐加大，使用更粗的格子。

  <img src="/Users/lingxin/Desktop/graphic/cascaded LPV.png" alt="cascaded LPV" style="zoom: 33%;" />

+ geometric LoD：例如同一个物体的高模、低模，根据离相机的距离选取使用那种模型放到场景里。

  > 在高低模切换是，用户可能感知到明显的不同，可以使用TAA来缓解。

### 7.6 Global Illumination Solutions

目前还没有哪一种GI能够应对所有情况（除了RTRT），但使用RTRT又对硬件性能要求高，所以工业界目前是将多种GI混合起来使用。

例如，我们做SSR，当SSR失效的时候，我们可以使用硬件或者软件做tracing来弥补。

+ 软件tracing：
  + 对于近处的物体，使用高质量的SDF做tracing
  + 对于远处的物体，使用低质量的SDF做tracing
  + 如果有亮度高的点光源或方向光源，使用RSM来解决
  + DDGI（待补充）
+ 硬件tracing
  + 使用简化的模型代替原始模型做tracing
  + RTXGI（待补充）



