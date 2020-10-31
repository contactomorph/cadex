
export class BinaryProgressiveEvent {
    private readonly _stepDuration: number
    private readonly _stepCount: number
    private _currentStep: number
    private _on: boolean
    private _callBacks: ((event: BinaryProgressiveEvent) => void)[]
    private _globalVersion: number
    /**
    * Create a new BinaryProgressiveEvent from a total duration in ms
    * and a number of steps from off to on.
    */
    constructor(duration: number, stepCount: number) {
        if (!Number.isInteger(duration))
            throw "Parameter duration should be an integer (number of milliseconds)"
        if (!Number.isInteger(stepCount))
            throw "Parameter stepCount should be an integer"
        if (duration <= 0)
            throw `Parameter duration should be positive but ${duration} found`
        if (stepCount <= 0)
            throw `Parameter stepCount should be positive but ${stepCount} found`
        this._stepDuration = duration / stepCount
        this._stepCount = stepCount
        this._currentStep = 0
        this._on = false
        this._callBacks = []
        this._globalVersion = 0
    }
    
    /**
    * Subscribe a callback that will be called whenever a step toward on or off is made.
    */
    subscribe(callback: (event: BinaryProgressiveEvent) => void): void {
        if (!(callback instanceof Function))
            throw "callback should be a function"
        this._callBacks.push(callback)
    }

    /**
    * Clear all subscribers.
    */
    clear(): void { this._callBacks = [] }
    
    /**
    * Change the state to "on" and periodically call subscribers
    * until they reach the maximal step.
    */
    setOn(): void {
        if (this._on) 
            return;
        this._globalVersion++
        this._on = true

        const version = this._globalVersion
        setTimeout(() => this._setOn(version), 0)
    }

    /**
    * Change the state to either "off" and periodically call subscribers
    * until they reach the step 0.
    */
    setOff(): void {
        if (!this._on)
            return;
        this._globalVersion++
        this._on = false

        const version = this._globalVersion
        setTimeout(() => this._setOff(version), 0)
    }
        
    /**
    * Change the state to "on" or "off" and periodically call subscribers
    * until they reach either the maximal step or step 0.
    */
    set(on: boolean): void {
        if (on) this.setOn(); else this.setOff()
    }
    
    /**
    * Force the state to "on" and maximal step
    * and call subscribers once if necessary.
    */
    forceOn(): void {
        this._globalVersion++
        this._on = true

        if (this._currentStep !== this._stepCount) {
            this._currentStep = this._stepCount
            setTimeout(() => this._callBacks.forEach(cb => cb(this)), 0)
        }
    }
    
    /**
    * Force the state to "off" and the step 0
    * and call subscribers once if necessary.
    */
    forceOff(): void {
        this._globalVersion++
        this._on = false

        if (this._currentStep !== 0) {
            this._currentStep = 0
            setTimeout(() => this._callBacks.forEach(cb => cb(this)), 0)
        }
    }
    
    /**
    * Force the state to "on" and maximal step without
    * calling subscribers.
    */
    silentlyForceOn(): void {
        this._globalVersion++
        this._on = true
        this._currentStep = this._stepCount
    }
    
    /**
    * Force the state to "off" and the step 0 without
    * calling subscribers.
    */
    silentlyForceOff(): void {
        this._globalVersion++
        this._on = false
        this._currentStep = 0
    }

    /**
    * Get the number of steps.
    */
    get stepCount(): number { return this._stepCount }

    /**
    * Get the current step.
    */
    get currentStep(): number { return this._currentStep }

    /**
    * Get the current step over the number of steps.
    */
    get ratio(): number {
        return this._currentStep / this._stepCount
    }

    /**
    * Check if the state is on.
    */
    get on(): boolean { return this._on }

    /**
    * Check if no progression is made anymore.
    */
    get stable(): boolean {
        return !this._on && this._currentStep === 0 ||
            this._on && this._currentStep === this._stepCount
    }

    /**
    * Check if the state is on and no progression is made anymore.
    */
    get stableAndOn(): boolean {
        return this._on && this._currentStep === this._stepCount
    }

    /**
    * Check if the state is off and no progression is made anymore.
    */
    get stableAndOff(): boolean {
        return !this._on && this._currentStep === 0
    }

    private _setOn(version: number): void {
        if (this._globalVersion === version && this._currentStep < this._stepCount) {
            this._currentStep++
            this._callBacks.forEach(cb => cb(this))
            if (this._globalVersion === version && this._currentStep < this._stepCount) {
                setTimeout(() => this._setOn(version), this._stepDuration)
            }
        }
    }
    
    private _setOff(version: number): void {
        if (this._globalVersion === version && 0 < this._currentStep) {
            this._currentStep--
            this._callBacks.forEach(cb => cb(this))
            if (this._globalVersion === version && 0 < this._currentStep) {
                setTimeout(() => this._setOff(version), this._stepDuration)
            }
        }
    }
}

export class UnboundedProgressiveEvent {
    private readonly _stepDuration: number
    private readonly _callBack: (event: UnboundedProgressiveEvent) => boolean
    private _active: boolean
    /**
    * Create a new UnspecifiedProgressiveEvent
    */
    constructor(stepDuration: number, callback: (event: UnboundedProgressiveEvent) => boolean) {
        if (!Number.isInteger(stepDuration))
            throw "Parameter stepDuration should be an integer (number of milliseconds)"
        if (stepDuration <= 0)
            throw `Parameter stepDuration should be positive but ${stepDuration} found`
        this._stepDuration = stepDuration
        this._callBack = callback
        this._active = false
    }
    
    /**
    * Change the state to "on" and periodically call subscribers
    * until they reach the maximal step.
    */
    fire(): void {
        if (this._active) 
            return;
        this._active = true
        setTimeout(() => this._continue(), 0)
    }

    /**
    * Change the state to either "off" and periodically call subscribers
    * until they reach the step 0.
    */
    forceStop(): void { this._active = false }
    /**
    * Check if no progression is made anymore.
    */
    get active(): boolean { return this._active }

    private _continue(): void {
        if (this._active) {
            this._active = this._callBack(this)
            if (this._active)
                setTimeout(() => this._continue(), this._stepDuration)
        }
    }
}