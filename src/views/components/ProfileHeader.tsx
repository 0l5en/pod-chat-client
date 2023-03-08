import Avatar from "./Avatar";
import WithTooltip from "./WithTooltip";

const ProfileHeader = ({ name, image, nameOnHover, size }: { name: string, image?: string, nameOnHover?: boolean, size?: 'md' | 'sm' }) => {
    return (
        <>
            {nameOnHover
                ? <WithTooltip tooltipMessage={name}>
                    {image
                        ? <Avatar isImage={true} srcValue={image} size={size} />
                        : <Avatar isImage={false} srcValue={name} size={size} />
                    }
                </WithTooltip>
                : image
                    ? <Avatar isImage={true} srcValue={image} size={size} />
                    : <Avatar isImage={false} srcValue={name} size={size} />
            }
            {!nameOnHover && <span className="text-truncate flex-fill">{name}</span>}
        </>
    );
};

export default ProfileHeader;