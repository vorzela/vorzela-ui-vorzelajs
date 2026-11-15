import { computed } from '@vorzelajs/core'
import { Show } from '@vorzelajs/dom'
import { accessorOf } from '../../hooks/index.ts'
import { cx } from '../../lib/cx.ts'
import styles from './qr-code.module.scss'

export type QRCodeLevel = 'L' | 'M' | 'Q' | 'H'

export interface QRCodeProps {
  value: string | (() => string)
  size?: number
  level?: QRCodeLevel
  /** Quiet-zone width in modules. */
  margin?: number
  color?: string
  background?: string
  title?: string
  caption?: string
  className?: string
}

/**
 * Renders a QR code as inline SVG. The encoder runs locally; the value is
 * never sent to a third party.
 */

const LEVEL_BITS: Record<QRCodeLevel, number> = { L: 1, M: 0, Q: 3, H: 2 }
const LEVEL_INDEX: Record<QRCodeLevel, number> = { L: 0, M: 1, Q: 2, H: 3 }

/**
 * RS block groups per version, ordered L|M|Q|H. Each group is a flat
 * `count,totalCodewords,dataCodewords` list.
 */
const RS_BLOCKS: string[] = [
  '1,26,19|1,26,16|1,26,13|1,26,9',
  '1,44,34|1,44,28|1,44,22|1,44,16',
  '1,70,55|1,70,44|2,35,17|2,35,13',
  '1,100,80|2,50,32|2,50,24|4,25,9',
  '1,134,108|2,67,43|2,33,15,2,34,16|2,33,11,2,34,12',
  '2,86,68|4,43,27|4,43,19|4,43,15',
  '2,98,78|4,49,31|2,32,14,4,33,15|4,39,13,1,40,14',
  '2,121,97|2,60,38,2,61,39|4,40,18,2,41,19|4,40,14,2,41,15',
  '2,146,116|3,58,36,2,59,37|4,36,16,4,37,17|4,36,12,4,37,13',
  '2,86,68,2,87,69|4,69,43,1,70,44|6,43,19,2,44,20|6,43,15,2,44,16',
  '4,101,81|1,80,50,4,81,51|4,50,22,4,51,23|3,36,12,8,37,13',
  '2,116,92,2,117,93|6,58,36,2,59,37|4,46,20,6,47,21|7,42,14,4,43,15',
  '4,133,107|8,59,37,1,60,38|8,44,20,4,45,21|12,33,11,4,34,12',
  '3,145,115,1,146,116|4,64,40,5,65,41|11,36,16,5,37,17|11,36,12,5,37,13',
  '5,109,87,1,110,88|5,65,41,5,66,42|5,54,24,7,55,25|11,36,12,7,37,13',
  '5,122,98,1,123,99|7,73,45,3,74,46|15,43,19,2,44,20|3,45,15,13,46,16',
  '1,135,107,5,136,108|10,74,46,1,75,47|1,50,22,15,51,23|2,42,14,17,43,15',
  '5,150,120,1,151,121|9,69,43,4,70,44|17,50,22,1,51,23|2,42,14,19,43,15',
  '3,141,113,4,142,114|3,70,44,11,71,45|17,47,21,4,48,22|9,39,13,16,40,14',
  '3,135,107,5,136,108|3,67,41,13,68,42|15,54,24,5,55,25|15,43,15,10,44,16',
  '4,144,116,4,145,117|17,68,42|17,50,22,6,51,23|19,46,16,6,47,17',
  '2,139,111,7,140,112|17,74,46|7,54,24,16,55,25|34,37,13',
  '4,151,121,5,152,122|4,75,47,14,76,48|11,54,24,14,55,25|16,45,15,14,46,16',
  '6,147,117,4,148,118|6,73,45,14,74,46|11,54,24,16,55,25|30,46,16,2,47,17',
  '8,132,106,4,133,107|8,75,47,13,76,48|7,54,24,22,55,25|22,45,15,13,46,16',
  '10,142,114,2,143,115|19,74,46,4,75,47|28,50,22,6,51,23|33,46,16,4,47,17',
  '8,152,122,4,153,123|22,73,45,3,74,46|8,53,23,26,54,24|12,45,15,28,46,16',
  '3,147,117,10,148,118|3,73,45,23,74,46|4,54,24,31,55,25|11,45,15,31,46,16',
  '7,146,116,7,147,117|21,73,45,7,74,46|1,53,23,37,54,24|19,45,15,26,46,16',
  '5,145,115,10,146,116|19,75,47,10,76,48|15,54,24,25,55,25|23,45,15,25,46,16',
  '13,145,115,3,146,116|2,74,46,29,75,47|42,54,24,1,55,25|23,45,15,28,46,16',
  '17,145,115|10,74,46,23,75,47|10,54,24,35,55,25|19,45,15,35,46,16',
  '17,145,115,1,146,116|14,74,46,21,75,47|29,54,24,19,55,25|11,45,15,46,46,16',
  '13,145,115,6,146,116|14,74,46,23,75,47|44,54,24,7,55,25|59,46,16,1,47,17',
  '12,151,121,7,152,122|12,75,47,26,76,48|39,54,24,14,55,25|22,45,15,41,46,16',
  '6,151,121,14,152,122|6,75,47,34,76,48|46,54,24,10,55,25|2,45,15,64,46,16',
  '17,152,122,4,153,123|29,74,46,14,75,47|49,54,24,10,55,25|24,45,15,46,46,16',
  '4,152,122,18,153,123|13,74,46,32,75,47|48,54,24,14,55,25|42,45,15,32,46,16',
  '20,147,117,4,148,118|40,75,47,7,76,48|43,54,24,22,55,25|10,45,15,67,46,16',
  '19,148,118,6,149,119|18,75,47,31,76,48|34,54,24,34,55,25|20,45,15,61,46,16',
]

const PATTERN_POSITIONS: number[][] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
]

type RSBlock = { totalCount: number; dataCount: number }

function getRSBlocks(version: number, level: QRCodeLevel): RSBlock[] {
  const group = (RS_BLOCKS[version - 1] as string).split('|')[
    LEVEL_INDEX[level]
  ] as string
  const values = group.split(',').map(Number)
  const blocks: RSBlock[] = []
  for (let index = 0; index < values.length; index += 3) {
    const count = values[index] as number
    const totalCount = values[index + 1] as number
    const dataCount = values[index + 2] as number
    for (let copy = 0; copy < count; copy += 1) {
      blocks.push({ totalCount, dataCount })
    }
  }
  return blocks
}

function totalDataCount(version: number, level: QRCodeLevel): number {
  return getRSBlocks(version, level).reduce(
    (sum, block) => sum + block.dataCount,
    0,
  )
}

const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)
{
  let value = 1
  for (let index = 0; index < 255; index += 1) {
    GF_EXP[index] = value
    GF_LOG[value] = index
    value <<= 1
    if (value & 0x100) value ^= 0x11d
  }
  for (let index = 255; index < 512; index += 1) {
    GF_EXP[index] = GF_EXP[index - 255] as number
  }
}

function gfExp(value: number): number {
  let next = value
  while (next < 0) next += 255
  return GF_EXP[next] as number
}

function gfMul(left: number, right: number): number {
  if (left === 0 || right === 0) return 0
  return GF_EXP[
    ((GF_LOG[left] as number) + (GF_LOG[right] as number)) % 255
  ] as number
}

function polyMultiply(left: number[], right: number[]): number[] {
  const result = Array.from({ length: left.length + right.length - 1 }, () => 0)
  for (let i = 0; i < left.length; i += 1) {
    for (let j = 0; j < right.length; j += 1) {
      result[i + j] = (result[i + j] as number) ^
        gfMul(left[i] as number, right[j] as number)
    }
  }
  return result
}

function errorCorrectPolynomial(length: number): number[] {
  let polynomial = [1]
  for (let index = 0; index < length; index += 1) {
    polynomial = polyMultiply(polynomial, [1, gfExp(index)])
  }
  return polynomial
}

function errorCorrection(data: number[], polynomial: number[]): number[] {
  const remainder = [
    ...data,
    ...Array.from({ length: polynomial.length - 1 }, () => 0),
  ]
  for (let index = 0; index < data.length; index += 1) {
    const factor = remainder[index] as number
    if (factor === 0) continue
    const logFactor = GF_LOG[factor] as number
    for (let offset = 0; offset < polynomial.length; offset += 1) {
      const coefficient = polynomial[offset] as number
      if (coefficient === 0) continue
      remainder[index + offset] =
        (remainder[index + offset] as number) ^
        gfExp(logFactor + (GF_LOG[coefficient] as number))
    }
  }
  return remainder.slice(data.length)
}

class BitBuffer {
  readonly bytes: number[] = []
  length = 0

  put(value: number, bits: number): void {
    for (let index = 0; index < bits; index += 1) {
      this.putBit(((value >>> (bits - index - 1)) & 1) === 1)
    }
  }

  putBit(dark: boolean): void {
    const index = Math.floor(this.length / 8)
    if (this.bytes.length <= index) this.bytes.push(0)
    if (dark) this.bytes[index] = (this.bytes[index] as number) | (0x80 >>> (this.length % 8))
    this.length += 1
  }
}

function createCodewords(
  version: number,
  level: QRCodeLevel,
  payload: Uint8Array,
): number[] {
  const buffer = new BitBuffer()
  const countBits = version < 10 ? 8 : 16
  buffer.put(4, 4)
  buffer.put(payload.length, countBits)
  for (const byte of payload) buffer.put(byte, 8)

  const dataCount = totalDataCount(version, level)
  if (buffer.length > dataCount * 8) {
    throw new Error('QR data does not fit')
  }
  if (buffer.length + 4 <= dataCount * 8) buffer.put(0, 4)
  while (buffer.length % 8 !== 0) buffer.putBit(false)
  while (buffer.length < dataCount * 8) {
    buffer.put(0xec, 8)
    if (buffer.length < dataCount * 8) buffer.put(0x11, 8)
  }

  const blocks = getRSBlocks(version, level)
  const dataBlocks: number[][] = []
  const errorBlocks: number[][] = []
  let offset = 0
  let maxData = 0
  let maxError = 0

  for (const block of blocks) {
    const data = buffer.bytes.slice(offset, offset + block.dataCount)
    offset += block.dataCount
    const polynomial = errorCorrectPolynomial(block.totalCount - block.dataCount)
    const error = errorCorrection(data, polynomial)
    dataBlocks.push(data)
    errorBlocks.push(error)
    maxData = Math.max(maxData, data.length)
    maxError = Math.max(maxError, error.length)
  }

  const result: number[] = []
  for (let index = 0; index < maxData; index += 1) {
    for (const block of dataBlocks) {
      if (index < block.length) result.push(block[index] as number)
    }
  }
  for (let index = 0; index < maxError; index += 1) {
    for (const block of errorBlocks) {
      if (index < block.length) result.push(block[index] as number)
    }
  }
  return result
}

function bchDigit(value: number): number {
  let digit = 0
  let current = value
  while (current !== 0) {
    digit += 1
    current >>>= 1
  }
  return digit
}

const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | 1
const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | 1
const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1)

function bchTypeInfo(data: number): number {
  let value = data << 10
  while (bchDigit(value) - bchDigit(G15) >= 0) {
    value ^= G15 << (bchDigit(value) - bchDigit(G15))
  }
  return ((data << 10) | value) ^ G15_MASK
}

function bchTypeNumber(data: number): number {
  let value = data << 12
  while (bchDigit(value) - bchDigit(G18) >= 0) {
    value ^= G18 << (bchDigit(value) - bchDigit(G18))
  }
  return (data << 12) | value
}

const MASK_FUNCTIONS: Array<(row: number, column: number) => boolean> = [
  (row, column) => (row + column) % 2 === 0,
  (row) => row % 2 === 0,
  (_row, column) => column % 3 === 0,
  (row, column) => (row + column) % 3 === 0,
  (row, column) =>
    (Math.floor(row / 2) + Math.floor(column / 3)) % 2 === 0,
  (row, column) => ((row * column) % 2) + ((row * column) % 3) === 0,
  (row, column) => (((row * column) % 2) + ((row * column) % 3)) % 2 === 0,
  (row, column) => (((row * column) % 3) + ((row + column) % 2)) % 2 === 0,
]

type Matrix = Array<Array<boolean | null>>

function emptyMatrix(size: number): Matrix {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, (): boolean | null => null),
  )
}

function placeFinder(matrix: Matrix, row: number, column: number): void {
  const size = matrix.length
  for (let r = -1; r <= 7; r += 1) {
    if (row + r < 0 || row + r >= size) continue
    for (let c = -1; c <= 7; c += 1) {
      if (column + c < 0 || column + c >= size) continue
      const dark =
        (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
        (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
        (r >= 2 && r <= 4 && c >= 2 && c <= 4)
      matrix[row + r]![column + c] = dark
    }
  }
}

function placeAlignment(matrix: Matrix, version: number): void {
  const positions = PATTERN_POSITIONS[version - 1] ?? []
  for (const row of positions) {
    for (const column of positions) {
      if (matrix[row]![column] !== null) continue
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          matrix[row + r]![column + c] =
            Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)
        }
      }
    }
  }
}

function placeTiming(matrix: Matrix): void {
  const size = matrix.length
  for (let row = 8; row < size - 8; row += 1) {
    if (matrix[row]![6] === null) matrix[row]![6] = row % 2 === 0
  }
  for (let column = 8; column < size - 8; column += 1) {
    if (matrix[6]![column] === null) matrix[6]![column] = column % 2 === 0
  }
}

function placeFormat(
  matrix: Matrix,
  level: QRCodeLevel,
  mask: number,
): void {
  const size = matrix.length
  const data = (LEVEL_BITS[level] << 3) | mask
  const bits = bchTypeInfo(data)

  for (let index = 0; index < 15; index += 1) {
    const dark = ((bits >> index) & 1) === 1
    if (index < 6) matrix[index]![8] = dark
    else if (index < 8) matrix[index + 1]![8] = dark
    else matrix[size - 15 + index]![8] = dark
  }

  for (let index = 0; index < 15; index += 1) {
    const dark = ((bits >> index) & 1) === 1
    if (index < 8) matrix[8]![size - index - 1] = dark
    else if (index < 9) matrix[8]![15 - index - 1 + 1] = dark
    else matrix[8]![15 - index - 1] = dark
  }

  matrix[size - 8]![8] = true
}

function placeVersion(matrix: Matrix, version: number): void {
  if (version < 7) return
  const size = matrix.length
  const bits = bchTypeNumber(version)
  for (let index = 0; index < 18; index += 1) {
    const dark = ((bits >> index) & 1) === 1
    matrix[Math.floor(index / 3)]![(index % 3) + size - 11] = dark
    matrix[(index % 3) + size - 11]![Math.floor(index / 3)] = dark
  }
}

function mapData(matrix: Matrix, data: number[], mask: number): void {
  const size = matrix.length
  const maskFunction = MASK_FUNCTIONS[mask] as (row: number, column: number) => boolean
  let increment = -1
  let row = size - 1
  let bitIndex = 7
  let byteIndex = 0

  for (let column = size - 1; column > 0; column -= 2) {
    if (column === 6) column -= 1
    while (true) {
      for (let offset = 0; offset < 2; offset += 1) {
        const targetColumn = column - offset
        if (matrix[row]![targetColumn] !== null) continue
        let dark = false
        if (byteIndex < data.length) {
          dark = (((data[byteIndex] as number) >>> bitIndex) & 1) === 1
        }
        if (maskFunction(row, targetColumn)) dark = !dark
        matrix[row]![targetColumn] = dark
        bitIndex -= 1
        if (bitIndex === -1) {
          byteIndex += 1
          bitIndex = 7
        }
      }
      row += increment
      if (row < 0 || row >= size) {
        row -= increment
        increment = -increment
        break
      }
    }
  }
}

function penalty(matrix: Matrix): number {
  const size = matrix.length
  let score = 0

  for (let row = 0; row < size; row += 1) {
    let run = 1
    for (let column = 1; column < size; column += 1) {
      if (matrix[row]![column] === matrix[row]![column - 1]) {
        run += 1
      } else {
        if (run >= 5) score += 3 + run - 5
        run = 1
      }
    }
    if (run >= 5) score += 3 + run - 5
  }

  for (let column = 0; column < size; column += 1) {
    let run = 1
    for (let row = 1; row < size; row += 1) {
      if (matrix[row]![column] === matrix[row - 1]![column]) {
        run += 1
      } else {
        if (run >= 5) score += 3 + run - 5
        run = 1
      }
    }
    if (run >= 5) score += 3 + run - 5
  }

  for (let row = 0; row < size - 1; row += 1) {
    for (let column = 0; column < size - 1; column += 1) {
      const value = matrix[row]![column]
      if (
        value === matrix[row]![column + 1] &&
        value === matrix[row + 1]![column] &&
        value === matrix[row + 1]![column + 1]
      ) {
        score += 3
      }
    }
  }

  const finderA = [true, false, true, true, true, false, true, false, false, false, false]
  const finderB = [false, false, false, false, true, false, true, true, true, false, true]

  const matches = (get: (index: number) => boolean, start: number, pattern: boolean[]): boolean =>
    pattern.every((value, offset) => get(start + offset) === value)

  for (let row = 0; row < size; row += 1) {
    for (let start = 0; start <= size - 11; start += 1) {
      const get = (index: number): boolean => Boolean(matrix[row]![index])
      if (matches(get, start, finderA) || matches(get, start, finderB)) score += 40
    }
  }
  for (let column = 0; column < size; column += 1) {
    for (let start = 0; start <= size - 11; start += 1) {
      const get = (index: number): boolean => Boolean(matrix[index]![column])
      if (matches(get, start, finderA) || matches(get, start, finderB)) score += 40
    }
  }

  let darkCount = 0
  for (const row of matrix) {
    for (const value of row) if (value) darkCount += 1
  }
  const ratio = Math.abs((100 * darkCount) / (size * size) - 50)
  score += Math.floor(ratio / 5) * 10
  return score
}

function chooseVersion(payloadLength: number, level: QRCodeLevel): number | null {
  for (let version = 1; version <= 40; version += 1) {
    const countBits = version < 10 ? 8 : 16
    const bits = 4 + countBits + payloadLength * 8
    if (bits <= totalDataCount(version, level) * 8) return version
  }
  return null
}

function buildModel(
  value: string,
  level: QRCodeLevel,
  margin: number,
): { dimension: number; path: string } | null {
  const payload = new TextEncoder().encode(value)
  const version = chooseVersion(payload.length, level)
  if (version === null) return null
  const codewords = createCodewords(version, level, payload)
  const size = version * 4 + 17

  let base = emptyMatrix(size)
  placeFinder(base, 0, 0)
  placeFinder(base, size - 7, 0)
  placeFinder(base, 0, size - 7)
  placeAlignment(base, version)
  placeTiming(base)
  // Reserve the format and version areas before data placement.
  placeFormat(base, level, 0)
  placeVersion(base, version)

  let best: Matrix | null = null
  let bestScore = Number.POSITIVE_INFINITY
  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = base.map((row) => row.slice())
    placeFormat(candidate, level, mask)
    mapData(candidate, codewords, mask)
    const score = penalty(candidate)
    if (score < bestScore) {
      bestScore = score
      best = candidate
    }
  }

  if (!best) return null
  const dimension = size + margin * 2
  const path: string[] = []
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (best[row]![column]) {
        path.push(`M${column + margin} ${row + margin}h1v1h-1z`)
      }
    }
  }
  return { dimension, path: path.join('') }
}

export function QRCode({
  value,
  size = 160,
  level = 'M',
  margin = 2,
  color = '#0b1220',
  background = '#ffffff',
  title,
  caption,
  className,
}: QRCodeProps) {
  const valueAccessor = accessorOf(value)
  const model = computed(() => {
    const current = valueAccessor()
    if (!current) return null
    try {
      return buildModel(current, level, margin)
    } catch {
      return null
    }
  })

  return (
    <Show when={() => Boolean(model())}>
      {() => (
        <div className={cx(styles.root, className)}>
          <svg
            className={styles.svg}
            width={size}
            height={size}
            viewBox={() => {
              const current = model()
              return current
                ? `0 0 ${current.dimension} ${current.dimension}`
                : undefined
            }}
            role="img"
            aria-label={title ?? 'QR code'}
            {...{ 'shape-rendering': 'crispEdges' }}
            style={{ '--qr-background': background }}
          >
            {title ? <title>{title}</title> : null}
            <rect
              width={() => model()?.dimension}
              height={() => model()?.dimension}
              fill={background}
            />
            <path d={() => model()?.path ?? ''} fill={color} />
          </svg>
          {caption ? <p className={styles.caption}>{caption}</p> : null}
        </div>
      )}
    </Show>
  )
}
