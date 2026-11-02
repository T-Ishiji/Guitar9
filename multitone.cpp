#include "pxt.h"

#if MICROBIT_CODAL
#include "nrf.h"
#endif

namespace guitarchord {

#if MICROBIT_CODAL
    static uint16_t seq0[1];
    static uint16_t seq1[1];
    static uint16_t seq2[1];

    // パルス幅を 1/16 単位で保持します。初期値 8/16 = 50% (square)。
    static uint8_t pulseWidth16 = 8;

    static void startPwm(
        NRF_PWM_Type *pwm,
        NRF_GPIO_Type *gpio,
        uint32_t port,
        uint32_t pin,
        uint16_t *seq,
        int frequency
    ) {
        if (frequency < 31)
            frequency = 31;
        if (frequency > 10000)
            frequency = 10000;

        pwm->TASKS_STOP = 1;
        pwm->ENABLE = 0;

        gpio->DIRSET = (1UL << pin);
        gpio->OUTCLR = (1UL << pin);

        pwm->PSEL.OUT[0] =
            (pin << PWM_PSEL_OUT_PIN_Pos) |
            (port << PWM_PSEL_OUT_PORT_Pos) |
            (PWM_PSEL_OUT_CONNECT_Connected << PWM_PSEL_OUT_CONNECT_Pos);

        pwm->PSEL.OUT[1] = 0xFFFFFFFF;
        pwm->PSEL.OUT[2] = 0xFFFFFFFF;
        pwm->PSEL.OUT[3] = 0xFFFFFFFF;

        pwm->MODE =
            (PWM_MODE_UPDOWN_Up << PWM_MODE_UPDOWN_Pos);

        pwm->PRESCALER =
            (PWM_PRESCALER_PRESCALER_DIV_16 << PWM_PRESCALER_PRESCALER_Pos);

        uint32_t top =
            (1000000UL + (uint32_t)frequency / 2) / (uint32_t)frequency;

        if (top < 2)
            top = 2;
        if (top > 32767)
            top = 32767;

        pwm->COUNTERTOP =
            (top << PWM_COUNTERTOP_COUNTERTOP_Pos);

        pwm->DECODER =
            (PWM_DECODER_LOAD_Common << PWM_DECODER_LOAD_Pos) |
            (PWM_DECODER_MODE_RefreshCount << PWM_DECODER_MODE_Pos);

        uint32_t compare = (top * (uint32_t)pulseWidth16 + 8UL) / 16UL;
        if (compare < 1)
            compare = 1;
        if (compare >= top)
            compare = top - 1;
        seq[0] = (uint16_t)compare;

        pwm->SEQ[0].PTR = (uint32_t)seq;
        pwm->SEQ[0].CNT = 1;
        pwm->SEQ[0].REFRESH = 0;
        pwm->SEQ[0].ENDDELAY = 0;

        pwm->LOOP = 1;
        pwm->SHORTS = PWM_SHORTS_LOOPSDONE_SEQSTART0_Msk;

        pwm->ENABLE =
            (PWM_ENABLE_ENABLE_Enabled << PWM_ENABLE_ENABLE_Pos);

        pwm->TASKS_SEQSTART[0] = 1;
    }

    static void stopPwm(
        NRF_PWM_Type *pwm,
        NRF_GPIO_Type *gpio,
        uint32_t pin
    ) {
        pwm->TASKS_STOP = 1;
        pwm->SHORTS = 0;
        pwm->ENABLE = 0;
        gpio->OUTCLR = (1UL << pin);
    }
#endif

    //%
    void setTimbreNative(int timbre) {
#if MICROBIT_CODAL
        switch (timbre) {
            case 0: pulseWidth16 = 8; break; // Square 50%
            case 1: pulseWidth16 = 6; break; // Pulse 37.5%
            case 2: pulseWidth16 = 4; break; // Pulse 25%
            case 3: pulseWidth16 = 2; break; // Pulse 12.5%
            case 4: pulseWidth16 = 1; break; // Pulse 6.25%
            default: pulseWidth16 = 8; break;
        }
#endif
    }

    //%
    void tone1(int frequency) {
#if MICROBIT_CODAL
        startPwm(NRF_PWM0, NRF_P0, 0, 12, seq0, frequency);
#endif
    }

    //%
    void tone2(int frequency) {
#if MICROBIT_CODAL
        startPwm(NRF_PWM1, NRF_P0, 0, 1, seq1, frequency);
#endif
    }

    //%
    void tone3(int frequency) {
#if MICROBIT_CODAL
        startPwm(NRF_PWM2, NRF_P1, 1, 2, seq2, frequency);
#endif
    }

    //%
    void stop1() {
#if MICROBIT_CODAL
        stopPwm(NRF_PWM0, NRF_P0, 12);
#endif
    }

    //%
    void stop2() {
#if MICROBIT_CODAL
        stopPwm(NRF_PWM1, NRF_P0, 1);
#endif
    }

    //%
    void stop3() {
#if MICROBIT_CODAL
        stopPwm(NRF_PWM2, NRF_P1, 2);
#endif
    }

    //%
    void stopAll() {
        stop1();
        stop2();
        stop3();
    }
}
