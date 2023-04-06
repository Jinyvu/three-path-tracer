import { PerspectiveCamera } from 'three';

export class PhysicalCamera extends PerspectiveCamera {
    public fStop = 1.4
    public apertureBlades = 0
    public apertureRotation = 0
    public focusDistance = 25
    public anamorphicRatio = 1

    set bokehSize(size) {
        this.fStop = this.getFocalLength() / size;
    }

    get bokehSize() {
        return this.getFocalLength() / this.fStop;
    }

    constructor(...args) {
        super(...args);
    }
}
