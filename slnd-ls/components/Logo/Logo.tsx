import Image from 'next/image'

export default function Logo() {
    return <Image
        src="/logo.dark.svg"
        alt="solend logo"
        width={100}
        height={50}
    />
}