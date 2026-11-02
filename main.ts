//% color=#F2B705 icon="\uf001" block="ギターコード"
//% groups=['スイッチ割り当て', '演奏モード', '和音', '音色', '個別出力']
namespace guitarchord {
    /**
     * 3音で鳴らす和音を選びます。
     * 7th / add9 など本来4音のコードは、3音に省略したボイシングです。
     */
    export enum Chord {
        //% block="A"
        A,
        //% block="A7"
        A7,
        //% block="Aadd9"
        Aadd9,
        //% block="Am"
        Am,
        //% block="Am7"
        Am7,
        //% block="AM7"
        AM7,
        //% block="Asus4"
        Asus4,

        //% block="B7"
        B7,
        //% block="B♭"
        BFlat,
        //% block="Bm"
        Bm,
        //% block="Bm7-5"
        Bm7b5,

        //% block="C"
        C,
        //% block="C7"
        C7,
        //% block="Cadd9"
        Cadd9,
        //% block="Cdim"
        Cdim,
        //% block="Cm"
        Cm,
        //% block="CM7"
        CM7,
        //% block="Csus4"
        Csus4,
        //% block="C♯m7-5"
        CSharpM7b5,

        //% block="D"
        D,
        //% block="D7"
        D7,
        //% block="Dm"
        Dm,
        //% block="Dm7"
        Dm7,
        //% block="Dsus4"
        Dsus4,
        //% block="D/F♯"
        DOverFSharp,

        //% block="E"
        E,
        //% block="E7"
        E7,
        //% block="Em"
        Em,
        //% block="Em7"
        Em7,
        //% block="Esus4"
        Esus4,

        //% block="F"
        F,
        //% block="Fm"
        Fm,
        //% block="FM7"
        FM7,
        //% block="Fsus4"
        Fsus4,
        //% block="F♯dim"
        FSharpDim,
        //% block="F♯m"
        FSharpM,

        //% block="G"
        G,
        //% block="G7"
        G7,
        //% block="Gadd9"
        Gadd9,
        //% block="Gsus4"
        Gsus4
    }


    /**
     * ブロック上で選択するボタンです。
     * 値は同時押し判定用のビットマスクです。
     * ボタン1=P1、ボタン2=P2、ボタン3=P8。ボタンなし=0。
     */
    export enum ChordButton {
        //% block="ボタンなし"
        NoButton = 0,
        //% block="ボタン1"
        Button1 = 1,
        //% block="ボタン2"
        Button2 = 2,
        //% block="ボタン3"
        Button3 = 4,
        //% block="ボタン1＋ボタン2"
        Button1Button2 = 3,
        //% block="ボタン2＋ボタン3"
        Button2Button3 = 6,
        //% block="ボタン1＋ボタン3"
        Button1Button3 = 5,
        //% block="ボタン1＋ボタン2＋ボタン3"
        Button1Button2Button3 = 7
    }

    /** シンセサイザーで使われるパルス幅を基準にした音色（波形）です。 */
    export enum Timbre {
        //% block="スクエア 50%"
        Square50 = 0,
        //% block="パルス 37.5%"
        Pulse375 = 1,
        //% block="パルス 25%"
        Pulse25 = 2,
        //% block="ナローパルス 12.5%"
        Pulse125 = 3,
        //% block="ウルトラナロー 6.25%"
        Pulse625 = 4
    }

    /** 3つの出力をどのように使うかを選びます。 */
    export enum PlayMode {
        //% block="通常の和音"
        Chord = 0,
        //% block="ユニゾン"
        Unison = 1,
        //% block="3倍音"
        Harmonics3 = 2,
        //% block="金管（近似）"
        Brass = 3
    }

    let assignedButtons: ChordButton[] = []
    let assignedChords: Chord[] = []
    let assignedModes: number[] = []
    let assignedF1: number[] = []
    let assignedF2: number[] = []
    let assignedF3: number[] = []
    let watcherStarted = false
    let playingAssignment = -1
    let chordDelayMs = 0
    let playMode = PlayMode.Chord
    let currentTimbre = Timbre.Square50

    // ジョイスティックは VR1: 6=3V, 5=P0, 4=GND を想定。
    // analogReadPin(P0) は 0～1023。中央付近では発音しません。
    let joystickLowThreshold = 350
    let joystickHighThreshold = 674
    let joystickControlledPlayback = false
    // 6側(3V側)=1、中央=0、4側(GND側)=-1
    let playingJoystickSide = 0
    let playingButtonMask = 0

    /**
     * 和音を鳴らすときの各音の時間差を設定します。
     * 0 = 3音同時、正 = 1→2→3、負 = 3→1→2。
     * 例: C(ド・ミ・ソ)で -120 ms の場合は ソ→ド→ミ。
     */
    //% blockId=guitarchord_v29_set_delay block="ディレイを $delay ms に設定する"
    //% group="和音" weight=95
    //% delay.defl=0
    export function setDelay(delay: number): void {
        chordDelayMs = delay
    }

    /**
     * 3つの音声出力に共通する音色（パルス幅）を設定します。
     * プリセット和音と、3周波数を直接指定した和音の両方に適用されます。
     */
    //% blockId=guitarchord_v34_set_timbre block="音色（波形）を $timbre にする"
    //% group="音色" weight=100
    //% timbre.defl=Timbre.Square50
    export function setTimbre(timbre: Timbre): void {
        currentTimbre = timbre
        setTimbreNative(timbre)
    }

    /** 内部用。PWMのパルス幅を設定します。 */
    //% shim=guitarchord::setTimbreNative
    //% blockHidden=true
    export function setTimbreNative(timbre: Timbre): void {
        0
    }

    /**
     * 3つの音声出力の使い方を設定します。
     * 指定しない場合は「通常の和音」です。
     */
    //% blockId=guitarchord_v34_set_play_mode block="演奏モードを $mode にする"
    //% group="演奏モード" weight=100
    //% mode.defl=PlayMode.Chord
    export function setPlayMode(mode: PlayMode): void {
        playMode = mode
    }


    /** P12 / P14 / P16 の3出力で和音を鳴らします。 */
    //% blockId=guitarchord_v29_play_chord block="和音 %chord を鳴らす"
    //% group="和音" weight=90
    //% chord.defl=Chord.C
    export function playChord(chord: Chord): void {
        switch (chord) {
            // A
            case Chord.A:          play3(220, 277, 330); break // A3 C#4 E4
            case Chord.A7:         play3(220, 277, 392); break // A3 C#4 G4
            case Chord.Aadd9:      play3(220, 277, 494); break // A3 C#4 B4
            case Chord.Am:         play3(220, 262, 330); break // A3 C4 E4
            case Chord.Am7:        play3(220, 262, 392); break // A3 C4 G4
            case Chord.AM7:        play3(220, 277, 415); break // A3 C#4 G#4
            case Chord.Asus4:      play3(220, 294, 330); break // A3 D4 E4

            // B
            case Chord.B7:         play3(247, 311, 440); break // B3 D#4 A4
            case Chord.BFlat:      play3(233, 294, 349); break // Bb3 D4 F4
            case Chord.Bm:         play3(247, 294, 370); break // B3 D4 F#4
            case Chord.Bm7b5:      play3(247, 294, 349); break // B3 D4 F4

            // C
            case Chord.C:          play3(262, 330, 392); break // C4 E4 G4
            case Chord.C7:         play3(262, 330, 466); break // C4 E4 Bb4
            case Chord.Cadd9:      play3(262, 330, 587); break // C4 E4 D5
            case Chord.Cdim:       play3(262, 311, 370); break // C4 Eb4 Gb4
            case Chord.Cm:         play3(262, 311, 392); break // C4 Eb4 G4
            case Chord.CM7:        play3(262, 330, 494); break // C4 E4 B4
            case Chord.Csus4:      play3(262, 349, 392); break // C4 F4 G4
            case Chord.CSharpM7b5: play3(277, 330, 392); break // C#4 E4 G4

            // D
            case Chord.D:          play3(294, 370, 440); break // D4 F#4 A4
            case Chord.D7:         play3(294, 370, 523); break // D4 F#4 C5
            case Chord.Dm:         play3(294, 349, 440); break // D4 F4 A4
            case Chord.Dm7:        play3(294, 349, 523); break // D4 F4 C5
            case Chord.Dsus4:      play3(294, 392, 440); break // D4 G4 A4
            case Chord.DOverFSharp:play3(185, 220, 294); break // F#3 A3 D4

            // E
            case Chord.E:          play3(330, 415, 494); break // E4 G#4 B4
            case Chord.E7:         play3(330, 415, 587); break // E4 G#4 D5
            case Chord.Em:         play3(330, 392, 494); break // E4 G4 B4
            case Chord.Em7:        play3(330, 392, 587); break // E4 G4 D5
            case Chord.Esus4:      play3(330, 440, 494); break // E4 A4 B4

            // F
            case Chord.F:          play3(175, 220, 262); break // F3 A3 C4
            case Chord.Fm:         play3(175, 208, 262); break // F3 Ab3 C4
            case Chord.FM7:        play3(175, 220, 330); break // F3 A3 E4
            case Chord.Fsus4:      play3(175, 233, 262); break // F3 Bb3 C4
            case Chord.FSharpDim:  play3(185, 220, 262); break // F#3 A3 C4
            case Chord.FSharpM:    play3(185, 220, 277); break // F#3 A3 C#4

            // G
            case Chord.G:          play3(196, 247, 294); break // G3 B3 D4
            case Chord.G7:         play3(196, 247, 349); break // G3 B3 F4
            case Chord.Gadd9:      play3(196, 247, 440); break // G3 B3 A4
            case Chord.Gsus4:      play3(196, 262, 294); break // G3 C4 D4
        }
    }

    /**
     * ボタン1=P1、ボタン2=P2、ボタン3=P8 として、
     * ボタンなし・単独押し・同時押しに選んだ和音を割り当てます。
     */
    //% blockId=guitarchord_v37_assign_chord block="$button に和音 $chord を割り当てる"
    //% group="スイッチ割り当て" weight=100
    //% button.defl=ChordButton.Button1
    //% chord.defl=Chord.C
    export function assignChord(button: ChordButton, chord: Chord): void {
        assignButtonChord(button, chord)
    }

    /**
     * ボタンを選び、3つの周波数を直接入力してオリジナルの和音を割り当てます。
     * ボタンなし・単独押し・同時押しのいずれにも設定できます。
     */
    //% blockId=guitarchord_v37_assign_custom block="$button に $f1 Hz / $f2 Hz / $f3 Hz を割り当てる"
    //% inlineInputMode=inline
    //% group="スイッチ割り当て" weight=99
    //% button.defl=ChordButton.Button1
    //% f1.defl=262 f1.min=31 f1.max=10000
    //% f2.defl=330 f2.min=31 f2.max=10000
    //% f3.defl=392 f3.min=31 f3.max=10000
    export function assignFrequencies(button: ChordButton, f1: number, f2: number, f3: number): void {
        assignButtonFrequencies(button, f1, f2, f3)
    }

    /** 内部用。ボタンまたは同時押しにプリセット和音を割り当てます。 */
    //% blockHidden=true
    export function assignButtonChord(button: ChordButton, chord: Chord): void {
        setupButtonPins()

        let found = findAssignment(button)
        if (found >= 0) {
            assignedChords[found] = chord
            assignedModes[found] = 0
        } else {
            assignedButtons.push(button)
            assignedChords.push(chord)
            assignedModes.push(0)
            assignedF1.push(0)
            assignedF2.push(0)
            assignedF3.push(0)
        }
        startWatcher()
    }

    /** 内部用。ボタンまたは同時押しに3周波数を割り当てます。 */
    //% blockHidden=true
    export function assignButtonFrequencies(button: ChordButton, f1: number, f2: number, f3: number): void {
        setupButtonPins()

        let found = findAssignment(button)
        if (found >= 0) {
            assignedModes[found] = 1
            assignedF1[found] = f1
            assignedF2[found] = f2
            assignedF3[found] = f3
        } else {
            assignedButtons.push(button)
            assignedChords.push(Chord.C)
            assignedModes.push(1)
            assignedF1.push(f1)
            assignedF2.push(f2)
            assignedF3.push(f3)
        }
        startWatcher()
    }

    /**
     * 旧API互換用。単独ピンの割り当てだけを受け付けます。
     */
    //% blockHidden=true
    export function assignPinChord(pin: DigitalPin, chord: Chord): void {
        if (pin == DigitalPin.P1) {
            assignButtonChord(ChordButton.Button1, chord)
        } else if (pin == DigitalPin.P2) {
            assignButtonChord(ChordButton.Button2, chord)
        } else if (pin == DigitalPin.P8) {
            assignButtonChord(ChordButton.Button3, chord)
        }
    }

    /** 旧API互換用。単独ピンに3周波数を割り当てます。 */
    //% blockHidden=true
    export function assignPinFrequencies(pin: DigitalPin, f1: number, f2: number, f3: number): void {
        if (pin == DigitalPin.P1) {
            assignButtonFrequencies(ChordButton.Button1, f1, f2, f3)
        } else if (pin == DigitalPin.P2) {
            assignButtonFrequencies(ChordButton.Button2, f1, f2, f3)
        } else if (pin == DigitalPin.P8) {
            assignButtonFrequencies(ChordButton.Button3, f1, f2, f3)
        }
    }

    function findAssignment(button: ChordButton): number {
        for (let i = 0; i < assignedButtons.length; i++) {
            if (assignedButtons[i] == button) {
                return i
            }
        }
        return -1
    }

    /** 3つのスイッチ入力をプルアップに設定します。 */
    function setupButtonPins(): void {
        pins.setPull(DigitalPin.P1, PinPullMode.PullUp)
        pins.setPull(DigitalPin.P2, PinPullMode.PullUp)
        pins.setPull(DigitalPin.P8, PinPullMode.PullUp)
        pins.setPull(DigitalPin.P0, PinPullMode.PullNone)
    }

    /**
     * P0につないだジョイスティックの方向を返します。
     * 6側(3V側)=1、中央=0、4側(GND側)=-1。
     */
    function getJoystickSide(): number {
        let value = pins.analogReadPin(AnalogPin.P0)
        if (value > joystickHighThreshold) {
            return 1
        }
        if (value < joystickLowThreshold) {
            return -1
        }
        return 0
    }

    /** ジョイスティックが中央から外れているとき true。 */
    function isJoystickActive(): boolean {
        return getJoystickSide() != 0
    }

    /**
     * 現在押されているボタンをビットマスクで返します。
     * Button1=1, Button2=2, Button3=4。
     */
    function readButtonMask(): number {
        let mask = 0
        if (pins.digitalReadPin(DigitalPin.P1) == 0) {
            mask = mask | 1
        }
        if (pins.digitalReadPin(DigitalPin.P2) == 0) {
            mask = mask | 2
        }
        if (pins.digitalReadPin(DigitalPin.P8) == 0) {
            mask = mask | 4
        }
        return mask
    }

    /**
     * 2つ以上のボタンを押す途中で単独押しが一瞬鳴るのを抑えるため、
     * 約15ms同じ状態が続いたときだけ切り替えます。
     */
    function startWatcher(): void {
        if (watcherStarted) {
            return
        }
        setupButtonPins()
        watcherStarted = true

        control.inBackground(function () {
            while (true) {
                let side1 = getJoystickSide()

                // 中央なら、ボタン状態に関係なく必ず無音。
                if (side1 == 0) {
                    if (playingAssignment != -1 || playingJoystickSide != 0) {
                        stopAll()
                        playingAssignment = -1
                        playingJoystickSide = 0
                        playingButtonMask = 0
                    }
                    basic.pause(5)
                    continue
                }

                let mask1 = readButtonMask()
                basic.pause(15)

                // 15ms後にも同じ方向へ倒れていることを確認。
                let side2 = getJoystickSide()
                if (side2 == 0 || side2 != side1) {
                    stopAll()
                    playingAssignment = -1
                    playingJoystickSide = 0
                    playingButtonMask = 0
                    basic.pause(5)
                    continue
                }

                let mask2 = readButtonMask()

                if (mask1 == mask2) {
                    let pressed = -1

                    // 完全一致で探す。mask=0 は「ボタンなし」の割り当て。
                    for (let i = 0; i < assignedButtons.length; i++) {
                        if (assignedButtons[i] == mask2) {
                            pressed = i
                            break
                        }
                    }

                    // ボタン状態またはジョイスティック方向が変わったら鳴り直す。
                    if (pressed != playingAssignment || side2 != playingJoystickSide) {
                        if (pressed >= 0) {
                            joystickControlledPlayback = true
                            playingJoystickSide = side2
                            playingButtonMask = mask2

                            if (assignedModes[pressed] == 1) {
                                play3(assignedF1[pressed], assignedF2[pressed], assignedF3[pressed])
                            } else {
                                playChord(assignedChords[pressed])
                            }

                            joystickControlledPlayback = false

                            // ディレイ中に中央へ戻したり反対側へ動かした場合は無音に戻す。
                            if (getJoystickSide() == side2) {
                                playingAssignment = pressed
                                playingJoystickSide = side2
                            } else {
                                stopAll()
                                playingAssignment = -1
                                playingJoystickSide = 0
                            }
                        } else {
                            stopAll()
                            playingAssignment = -1
                            playingJoystickSide = 0
                        }
                    }
                }

                basic.pause(5)
            }
        })
    }

    /**
     * 演奏モードに応じて3つの出力周波数を決定します。
     * 通常の和音以外では第1周波数を基音として使います。
     */
    function play3(f1: number, f2: number, f3: number): void {
        if (playMode == PlayMode.Unison) {
            play3Raw(f1, f1, f1)
        } else if (playMode == PlayMode.Harmonics3) {
            play3Raw(f1, f1 * 2, f1 * 3)
        } else if (playMode == PlayMode.Brass) {
            // 金管らしい明るい音に近づけるため、演奏中だけ25%パルスを使用します。
            setTimbreNative(Timbre.Pulse25)
            play3Raw(f1, f1 * 2, f1 * 3)
            // ユーザーが選んだ音色設定へ戻します。
            setTimbreNative(currentTimbre)
        } else {
            play3Raw(f1, f2, f3)
        }
    }

    /**
     * 3つの周波数を設定したディレイで実際に出力します。
     *
     * ジョイスティック発音時:
     * 6側(3V側) = 1→2→3（例: ド→ミ→ソ）
     * 4側(GND側) = 3→2→1（例: ソ→ミ→ド）
     *
     * ジョイスティックを使わず直接「和音を鳴らす」場合は、
     * 従来どおり正のディレイ=1→2→3、負のディレイ=3→1→2です。
     */
    function play3Raw(f1: number, f2: number, f3: number): void {
        if (chordDelayMs == 0) {
            tone1(f1)
            tone2(f2)
            tone3(f3)
            return
        }

        if (joystickControlledPlayback) {
            let d = chordDelayMs
            if (d < 0) {
                d = -d
            }

            stopAll()

            if (playingJoystickSide > 0) {
                // 6側: 1→2→3
                tone1(f1)
                if (!delayPause(d)) return
                tone2(f2)
                if (!delayPause(d)) return
                tone3(f3)
            } else {
                // 4側: 3→2→1
                tone3(f3)
                if (!delayPause(d)) return
                tone2(f2)
                if (!delayPause(d)) return
                tone1(f1)
            }
            return
        }

        // 直接発音ブロックは従来仕様を維持。
        if (chordDelayMs > 0) {
            stopAll()
            tone1(f1)
            basic.pause(chordDelayMs)
            tone2(f2)
            basic.pause(chordDelayMs)
            tone3(f3)
        } else {
            let d = -chordDelayMs
            stopAll()
            tone3(f3)
            basic.pause(d)
            tone1(f1)
            basic.pause(d)
            tone2(f2)
        }
    }

    /**
     * ジョイスティック発音中のディレイ待機。
     * 次のどれかが起きたら途中でも即座に停止します。
     * - ジョイスティックを中央へ戻した
     * - ジョイスティックを反対側へ倒した
     * - ボタンの押し方が変わった
     *
     * 停止後は watcher が新しい状態を読み取り、新しい和音を鳴らします。
     */
    function delayPause(ms: number): boolean {
        if (!joystickControlledPlayback) {
            basic.pause(ms)
            return true
        }

        let expectedSide = playingJoystickSide
        let expectedMask = playingButtonMask
        let remain = ms

        while (remain > 0) {
            if (getJoystickSide() != expectedSide || readButtonMask() != expectedMask) {
                stopAll()
                playingAssignment = -1
                playingJoystickSide = 0
                playingButtonMask = 0
                return false
            }

            let step = 5
            if (remain < step) {
                step = remain
            }
            basic.pause(step)
            remain = remain - step
        }

        return true
    }

    //% block="出力1 P12 を %frequency Hz"
    //% frequency.min=31 frequency.max=10000
    //% shim=guitarchord::tone1
    //% group="個別出力" weight=60
    export function tone1(frequency: number): void {
        0
    }

    //% block="出力2 P14 を %frequency Hz"
    //% frequency.min=31 frequency.max=10000
    //% shim=guitarchord::tone2
    //% group="個別出力" weight=59
    export function tone2(frequency: number): void {
        0
    }

    //% block="出力3 P16 を %frequency Hz"
    //% frequency.min=31 frequency.max=10000
    //% shim=guitarchord::tone3
    //% group="個別出力" weight=58
    export function tone3(frequency: number): void {
        0
    }

    //% block="出力1を止める"
    //% shim=guitarchord::stop1
    //% group="個別出力" weight=40
    export function stop1(): void {
        0
    }

    //% block="出力2を止める"
    //% shim=guitarchord::stop2
    //% group="個別出力" weight=39
    export function stop2(): void {
        0
    }

    //% block="出力3を止める"
    //% shim=guitarchord::stop3
    //% group="個別出力" weight=38
    export function stop3(): void {
        0
    }

    //% block="全部の音を止める"
    //% shim=guitarchord::stopAll
    //% group="和音" weight=80
    export function stopAll(): void {
        0
    }
}
