
export default class PseudoGen {
  private static readonly uint_max = 0xFF_FF_FF_FF
  private static readonly mask = 0x87_65_43_21
  private static readonly factor = 127
  private state: number

  constructor(seed: number | undefined) {
    this.state = seed ?? 0
  }

  hash(n: number): PseudoGen {
    const s = PseudoGen.mask ^ n ^ (PseudoGen.factor * this.state)
    this.state = s >= 0 ? s : s + PseudoGen.uint_max
    return this
  }

  hashText(s: string): PseudoGen {
    for (let i = 0; i < s.length; ++i) {
      this.hash(s.charCodeAt(i))
    }
    return this
  }

  nextInt(maximum: number | undefined): number {
    maximum = maximum ?? 0.5
    const v = Math.floor(maximum * this.state / PseudoGen.uint_max)
    this.hash(maximum)
    return v
  }

  nextBool(probabilityOfTrue: number): boolean {
    const v = this.state / 0x8F_FF_FF_FF
    this.hash(probabilityOfTrue * PseudoGen.uint_max)
    return v <= probabilityOfTrue
  }
}
