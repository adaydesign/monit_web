import { createContext } from "react";

export const defaultValues = {
    selected: 0,
    data: null,
    loading: false,
    error: null
}

const groupContext = createContext(defaultValues)
export default groupContext

export const TYPE_SELECT = "select"
export const TYPE_DATA = "data"
export const TYPE_LOADING = "loading"
export const TYPE_ERROR = "error"

export const groupReducer = (state, action) => {
    switch (action.type) {
        case TYPE_SELECT:
        case TYPE_DATA:
        case TYPE_LOADING:
        case TYPE_ERROR: return { ...state, ...action.value }
        default: return state
    }
}

// update select
export const setSelected = (groupID) => {
    return {
        type: TYPE_SELECT,
        value: {
            selected: groupID,
            loading: false,
            error: null
        }
    }
}

// update data
export const setData = (data) => {
    const selectedID = data[0]?.id // first group's id
    return {
        type: TYPE_DATA,
        value: {
            data: data,
            selected: selectedID,
            loading: false,
            error: null
        }
    }
}

// update loading
export const setLoading = (loading) => {
    return {
        type: TYPE_LOADING,
        value: {
            loading: loading,
            error: null
        }
    }
}

// update error
export const setError = (error) => {
    return {
        type: TYPE_LOADING,
        value: {
            selected: 0,
            data: null,
            loading: false,
            error: error
        }
    }
}