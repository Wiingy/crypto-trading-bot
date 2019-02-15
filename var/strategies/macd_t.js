'use strict';

let SignalResult = require('../dict/signal_result')

module.exports = class macd_t {
    getName() {
        return 'macd_t'
    }

    buildIndicator(indicatorBuilder, options) {
        if (!options['period']) {
            throw 'Invalid period'
        }

        indicatorBuilder.add('macd', 'macd', options['period'])

        indicatorBuilder.add('sma720', 'sma', options['period'], {
            'length': 720,
        })

        indicatorBuilder.add('ema550', 'ema', options['period'], {
            'length': 550,
        })
    }

    period(indicatorPeriod) {
        return this.macd(
            indicatorPeriod.getPrice(),
            indicatorPeriod.getIndicator('sma720'),
            indicatorPeriod.getIndicator('ema550'),
            indicatorPeriod.getIndicator('macd'),
            indicatorPeriod.getLastSignal(),
        )
    }

    async macd(price, sma720Full, ema550Full, macdFull, lastSignal) {
        if (!macdFull || !ema550Full || macdFull.length < 2 || sma720Full.length < 2 || ema550Full.length < 2) {
            return
        }

        // remove incomplete candle
        let sma720 = sma720Full.slice(0, -1)
        let ema550 = ema550Full.slice(0, -1)
        let macd = macdFull.slice(0, -1)

        let debug = {
            'sma720': sma720.slice(-1)[0],
            'ema550': ema550.slice(-1)[0],
            'histogram': macd.slice(-1)[0].histogram,
            'last_signal': lastSignal,
        }

        let before = macd.slice(-2)[0].histogram
        let last = macd.slice(-1)[0].histogram

        // trend change
        if (
            (lastSignal === 'long' && before > 0 && last < 0)
            || (lastSignal === 'short' && before < 0 && last > 0)
        ) {
            return SignalResult.createSignal('close', 'debug')
        }

        // sma long
        let long = price >= sma720.slice(-1)[0]

        // ema long
        if (!long) {
            long = price >= ema550.slice(-1)[0]
        }

        if (long) {
            // long
            if(before < 0 && last > 0) {
                return SignalResult.createSignal('long', 'debug')
            }
        } else {
            // short

            if(before > 0 && last < 0) {
                return SignalResult.createSignal('short', 'debug')
            }
        }

        return SignalResult.createEmptySignal(debug)
    }

    getOptions() {
        return {
            'period': '1m',
        }
    }
}
