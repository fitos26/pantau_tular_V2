import HelpImage from "./HelpImage";

interface HelpSectionProps {
    readonly title: string;
    readonly description: string;
    readonly imageSrc: string;
    readonly imageAlt: string;
}

export default function HelpSection({ 
    title, 
    description, 
    imageSrc, 
    imageAlt 
}: HelpSectionProps) {
    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-blue-900">
                {title}
            </h2>
            <p className="text-gray-700 mt-2">
                {description}
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <HelpImage src="/help/pt-1.png" alt="Peta umum" />
                <HelpImage src={imageSrc} alt={imageAlt} />
                <HelpImage src="/help/pt-2.png" alt="Detail kasus" />
            </div>
        </div>
    );
} 