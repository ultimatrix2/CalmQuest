import { useState } from 'react'

function App() {
    const [count, setCount] = useState(0)

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">
                Welcome to CalmQuest
            </h1>
            <div className="p-6 bg-white rounded-xl shadow-lg flex items-center space-x-4">
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    onClick={() => setCount((count) => count + 1)}
                >
                    count is {count}
                </button>
                <p className="text-gray-600">
                    Edit <code>src/App.tsx</code> to get started.
                </p>
            </div>
        </div>
    )
}

export default App
