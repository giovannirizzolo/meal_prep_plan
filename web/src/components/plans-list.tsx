import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Edit, Eye, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { WeeklyPlan } from "../types/food"


// Types



interface PlansListProps {
    isLoading?: boolean;
    plansList?: WeeklyPlan[];
    handleCreateNew: () => void;
}

export function PlansList({ isLoading: initialLoading, plansList: initialPlans, handleCreateNew }: PlansListProps) {
    const [plans, setPlans] = useState<WeeklyPlan[]>(initialPlans || [])
    

    // const getStatusBadge = (status: WeeklyPlan['status']) => {
    //     const variants: Record<WeeklyPlan['status'], string> = {
    //         active: "bg-green-100 text-green-800 hover:bg-green-100",
    //         draft: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    //         completed: "bg-gray-100 text-gray-800 hover:bg-gray-100"
    //     }

    //     const labels: Record<WeeklyPlan['status'], string> = {
    //         active: "Attivo",
    //         draft: "Bozza",
    //         completed: "Completato"
    //     }

    //     return (
    //         <Badge variant="secondary" className={variants[status]}>
    //             {labels[status]}
    //         </Badge>
    //     )
    // }

    const handleView = (planId: string) => {
        console.log("View plan:", planId)
        // Implement view logic
    }

    const handleEdit = (planId: string) => {
        console.log("Edit plan:", planId)
        // Implement edit logic
    }

    const handleDelete = (planId: string) => {
        console.log("Delete plan:", planId)
        // Implement delete logic with confirmation
        setPlans(plans.filter(plan => plan.id !== planId))
    }


    if (initialLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <div className="text-sm text-muted-foreground">Caricamento piani...</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Piani Settimanali</CardTitle>
                        <CardDescription>
                            Gestisci i tuoi piani alimentari settimanali
                        </CardDescription>
                    </div>
                    <Button onClick={handleCreateNew} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Nuovo Piano
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome Piano</TableHead>
                                <TableHead>Giorni</TableHead>
                                <TableHead>Kcal/Giorno</TableHead>
                                <TableHead>Macro (%)</TableHead>
                                <TableHead>Stato</TableHead>
                                <TableHead>Data Creazione</TableHead>
                                <TableHead className="w-[70px]">Azioni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialPlans?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="text-sm text-muted-foreground">
                                                Nessun piano trovato
                                            </div>
                                            <Button variant="outline" size="sm" onClick={handleCreateNew}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Crea il tuo primo piano
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                initialPlans?.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell className="font-medium">{plan.name}</TableCell>
                                        <TableCell>{plan.days} giorni</TableCell>
                                        <TableCell>{plan.daily_kcal.toLocaleString()} kcal</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <span className="text-blue-600">C: {plan.macro_pct.carb}%</span>
                                                {" • "}
                                                <span className="text-green-600">P: {plan.macro_pct.protein}%</span>
                                                {" • "}
                                                <span className="text-orange-600">F: {plan.macro_pct.fat}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{'-'}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date().toLocaleDateString("it-IT")}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Apri menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleView(plan.id)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Visualizza
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEdit(plan.id)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Modifica
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(plan.id)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Elimina
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}