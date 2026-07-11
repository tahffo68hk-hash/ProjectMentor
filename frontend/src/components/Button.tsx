type ButtonProps = {
    text: string;
};

export default function Button({ text }: ButtonProps) {
    return (
        <button className="mt-12 px-8 py-4 rounded-xl bg-black text-white text-xl hover:bg-gray-800 transition">
            {text}
        </button>
    );
}