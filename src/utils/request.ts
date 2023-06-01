interface IRequestRes<T> {
    success: boolean;
    data: T;
    message: string;
    error: string;
}

const BACKEND_HOST = process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:7001' : ''

/**
 * 所有請求統一使用post
 * @param url 
 * @param params 
 */
export default function request<T>(url: string, params: any): Promise<T> {
    console.log(params)
    return new Promise((resolve, reject) => {
        fetch(`${BACKEND_HOST}/${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: JSON.stringify({...params}),
            credentials: 'include'
            
        }).then(response => response.json().then((result: IRequestRes<T>) => {
            if(result.success){
                resolve(result.data)
            }
            else {
                reject(result.error)
            }
        })).catch(err => reject(err))
    })
}

export function requestFile<T>(url: string, params: any): Promise<T> {
    const formData = new FormData()
    for(let key in params){
        formData.append(key, params[key])
    }
    return new Promise((resolve, reject) => {
        fetch(`${BACKEND_HOST}/${url}`, {
            method: 'POST',
            body: formData,
        }).then(response => response.json().then((result: IRequestRes<T>) => {
            if(result.success){
                resolve(result.data)
            }
            else {
                reject(result.message)
            }
        })).catch(err => reject(err))
    })
}