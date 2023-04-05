interface IRequestRes<T> {
    success: boolean;
    data: T;
    message: string;
}

/**
 * 所有請求統一使用post
 * @param url 
 * @param params 
 */
export default function request<T>(url: string, params: any): Promise<T> {
    return new Promise((resolve, reject) => {
        fetch(`${process.env.BACK_HOST}/${url}`, {
            method: 'POST',
            body: {...params},
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

export function requestFile<T>(url: string, params: any): Promise<T> {
    const formData = new FormData()
    for(let key in params){
        formData.append(key, params[key])
    }
    return new Promise((resolve, reject) => {
        fetch(`${process.env.BACK_HOST}/${url}`, {
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