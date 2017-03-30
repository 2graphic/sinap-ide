// Similar to Promise.all. However, this will always resolve and ignore rejected promises.
export function somePromises<T>(promises: Iterable<Promise<T>>): Promise<T[]> {
    let result: Promise<T[]> = Promise.resolve([]);

    for (const promise of promises) {
        result = result.then((arr) => {
            return promise.then((ele) => {
                arr.push(ele);
                return arr;
            }).catch((err) => {
                console.log(err);
                return arr;
            });
        });
    }

    return result;
}