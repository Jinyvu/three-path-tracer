import style from './style.module.scss';
import init from '../../myRender/index';
import { useEffect } from 'react';

export default function RenderContainer() {
  useEffect(() => {
    init({
      canvasId: 'renderTarget',
      loadingId: 'loading',
      samplesId: 'samples',
    });
  }, []);

  return (
    <div className={style.container}>
      <div id="loading" className={style.loading}>
        LOADING
      </div>
      <div id="info" className={style.info}>
        <div>
          <div id="samples" className={style.samples}>
            --
          </div>
        </div>
        <div>
          <div id="credits" className={style.credits}>
            --
          </div>
        </div>
      </div>
      <canvas className={style.canvas} id="renderTarget"></canvas>
    </div>
  );
}
