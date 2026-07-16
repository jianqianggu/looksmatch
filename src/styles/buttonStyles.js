/**
 * Shared styling functions and constants
 */

export const labelStyle = {
    display: "block",
    fontSize: 11,
    color: "#8A8D99",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
};

export function voteBtnStyle(color) {
    return {
        background: "transparent",
        border: `1px solid ${color}`,
        color,
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
    };
}

export function circleBtnStyle(color) {
    return {
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        color,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
    };
}

export const undoBtnStyle = {
    background: "transparent",
    border: "1px solid #2A2D37",
    color: "#8A8D99",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
};

export function tabBtnStyle(active) {
    return {
        background: "transparent",
        border: "none",
        borderBottom: active ? "2px solid #F2B84B" : "2px solid transparent",
        color: active ? "#F2F1ED" : "#8A8D99",
        padding: "8px 14px",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        marginBottom: -1,
    };
}
