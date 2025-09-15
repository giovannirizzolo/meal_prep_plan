import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";


import MenuItemComponent, { MenuItemType } from "./menu-item";


const mealPlanSubMenuList: MenuItemType[] = [
    {
        title: "Visualizza piani alimentari",
        href: "/meal-plans",
        description:
            "Visualizza la lista di tutti i piani alimentari creati da te",
    },
    {
        title: "Crea piano alimentare",
        href: "/meal-plans/new",
        description:
            "Crea un nuovo piano personalizzato includendo i pasti che preferisci",
    }
]

const mealSubMenuList: MenuItemType[] = [
    {
        title: "Visualizza pasti",
        href: "/meals",
        description:
            "Visualizza la lista di tutti i pasti creati da te",
    },
    {
        title: "Crea pasto",
        href: "/meals/new",
        description:
            "Crea un pasto personalizzato includendo gli alimenti che preferisci",
    }
]

const dayOfEatingSubMenuList: MenuItemType[] = [
    {
        title: "Visualizza tutti",
        href: "/day-of-eating",
        description:
            "Visualizza i tuoi full day of eating",
    },
    {
        title: "Crea nuovo",
        href: "/day-of-eating/new",
        description:
            "Crea un nuovo template per un full day of eating",
    },
]

export function NavigationMenuCustom() {
    return (
        <NavigationMenu>
            <NavigationMenuList>
                <MenuItemComponent triggerName={'Piani Alimentari'} itemsList={mealPlanSubMenuList} />
                <MenuItemComponent triggerName={'Pasti'} itemsList={mealSubMenuList} />
                <MenuItemComponent triggerName={'Day of eating'} itemsList={dayOfEatingSubMenuList} />
            </NavigationMenuList>
        </NavigationMenu>
    )
}