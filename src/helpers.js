export function grow(rate) {
    return {
        update() {
            const n = rate * dt()
            this.scale.x += n
            this.scale.y += n
        },
    }
} 

export function late(t) {
    let timer = 0
    return {
        add() {
            this.hidden = true
        },
        update() {
            timer += dt()
            if (timer >= t) {
                this.hidden = false
            }
        },
    }
} 
