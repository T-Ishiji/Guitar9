// VR1: 6=3V, 5=P0, 4=GND
// Cコード・ディレイ100msの例:
// 6側 -> ド→ミ→ソ
// 4側 -> ソ→ミ→ド
// ディレイ途中でボタン状態またはジョイスティック方向が変わると即停止し、新しい和音へ切り替わる。
guitarchord.setDelay(100)
guitarchord.assignChord(guitarchord.ChordButton.NoButton, guitarchord.Chord.C)
guitarchord.assignChord(guitarchord.ChordButton.Button1, guitarchord.Chord.G)
guitarchord.assignChord(guitarchord.ChordButton.Button2, guitarchord.Chord.Am)
