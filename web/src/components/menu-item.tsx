import { NavigationMenuContent, NavigationMenuItem, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { NavigationMenuListItem } from "./nav-menu-list-item";

interface MenuItemProps {
    triggerName: string
    itemsList: MenuItemType[]
}

export interface MenuItemType { title: string; href: string; description: string }

export default function MenuItem({
    triggerName,
    itemsList
}: MenuItemProps) {

    return (
        <NavigationMenuItem>
            <NavigationMenuTrigger>{triggerName}</NavigationMenuTrigger>
            <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {itemsList.map(({ title, href, description }) => (
                        <NavigationMenuListItem
                            key={title}
                            title={title}
                            href={href}
                        >
                            {description}
                        </NavigationMenuListItem>
                    ))}
                </ul>
            </NavigationMenuContent>
        </NavigationMenuItem>
    )
}