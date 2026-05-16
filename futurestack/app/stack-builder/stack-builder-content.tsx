"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleSelector } from "@/components/ui/role-selector";
import { ToolBadge } from "@/components/ui/tool-badge";
import { ToolLogo } from "@/components/cards/tool-card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole, Tool } from "@/lib/types";
import {
  Search,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Save,
  Share2,
  Download,
  Trash2,
  Sparkles,
  DollarSign,
  Layers,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}
interface StackBuilderContentProps {
  initialTools: Tool[];
  initialCategories: Category[];
}

export function StackBuilderContent({
  initialTools,
  initialCategories,
}: StackBuilderContentProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stackTools, setStackTools] = useState<Tool[]>([]);
  const [stackName, setStackName] = useState("My Custom Stack");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const recommendedTools = useMemo(() => {
    if (!selectedRole) return [];
    return initialTools
      .filter((t) => {
        if (selectedRole === "freelancer")
          return t.pricing.hasFree || t.badges.includes("no-code");
        if (selectedRole === "agency") return t.integrations.length > 2;
        if (selectedRole === "saas-founder")
          return ["code", "automation", "analytics"].includes(t.category);
        return true;
      })
      .slice(0, 6);
  }, [selectedRole, initialTools]);

  const filteredTools = useMemo(
    () =>
      initialTools.filter((t) => {
        if (stackTools.some((s) => s.id === t.id)) return false;
        if (
          searchQuery &&
          !t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !t.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
        )
          return false;
        if (selectedCategory && t.category !== selectedCategory) return false;
        return true;
      }),
    [searchQuery, selectedCategory, stackTools, initialTools],
  );

  const stackStats = useMemo(() => {
    const cats = new Set(stackTools.map((t) => t.category));
    const cost = stackTools.reduce((sum, t) => {
      const plan = t.pricing.plans.find((p) => /pro|standard/i.test(p.name));
      const price = parseFloat(plan?.price.replace("$", "") ?? "0");
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    return {
      toolCount: stackTools.length,
      categoryCount: cats.size,
      estimatedCost: cost,
      hasFreeTier: stackTools.some((t) => t.pricing.hasFree),
    };
  }, [stackTools]);

  const addToStack = (tool: Tool) => {
    if (!stackTools.some((t) => t.id === tool.id))
      setStackTools((p) => [...p, tool]);
  };
  const removeFromStack = (id: string) =>
    setStackTools((p) => p.filter((t) => t.id !== id));
  const moveToolUp = (i: number) => {
    if (i === 0) return;
    setStackTools((p) => {
      const n = [...p];
      [n[i - 1], n[i]] = [n[i], n[i - 1]];
      return n;
    });
  };
  const moveToolDown = (i: number) => {
    if (i === stackTools.length - 1) return;
    setStackTools((p) => {
      const n = [...p];
      [n[i], n[i + 1]] = [n[i + 1], n[i]];
      return n;
    });
  };

  async function saveStack() {
    if (!user) {
      toast.error("Sign in to save your stack");
      router.push("/login");
      return;
    }
    if (stackTools.length === 0) {
      toast.error("Add at least one tool");
      return;
    }
    setIsSaving(true);
    const supabase = createClient();

    const { data: stack, error: stackError } = await supabase
      .from("stacks")
      .insert({
        name: stackName,
        target_role: selectedRole,
        creator_id: user.id,
        clone_count: 0,
        rating: 0,
      })
      .select()
      .single();

    if (stackError) {
      toast.error("Failed to save stack");
      setIsSaving(false);
      return;
    }

    const stackToolRows = stackTools.map((t, idx) => ({
      stack_id: stack.id,
      tool_id: t.id,
      position: idx,
    }));
    await supabase.from("stack_tools").insert(stackToolRows);

    toast.success("Stack saved!");
    setIsSaving(false);
    router.push("/stacks");
  }

  function exportStack() {
    const data = {
      name: stackName,
      role: selectedRole,
      tools: stackTools.map((t) => ({
        name: t.name,
        website: t.website,
        category: t.category,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${stackName.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Stack exported!");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30">
        <section className="border-b border-border bg-background py-8 lg:py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <h1 className="text-3xl font-bold lg:text-4xl">Stack Builder</h1>
            <p className="mt-2 text-muted-foreground">
              Select your role and add tools to create a custom workflow.
            </p>
          </div>
        </section>

        {/* Role step */}
        {!selectedRole && (
          <section className="py-12 lg:py-16">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
                  <Sparkles className="h-4 w-4" /> Step 1 of 2
                </div>
                <h2 className="text-2xl font-bold lg:text-3xl">
                  Select Your Role
                </h2>
                <p className="mt-2 text-muted-foreground">
                  We&apos;ll recommend tools based on your workflow.
                </p>
                <div className="mt-8">
                  <RoleSelector
                    value={selectedRole}
                    onChange={setSelectedRole}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Builder step */}
        {selectedRole && (
          <section className="py-8 lg:py-12">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: Tool selection */}
                <div className="flex-1">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {selectedRole.replace("-", " ")}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRole(undefined)}
                      >
                        Change
                      </Button>
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm text-primary">
                      <Sparkles className="h-4 w-4" /> Step 2: Add Tools
                    </div>
                  </div>

                  {recommendedTools.length > 0 && stackTools.length === 0 && (
                    <Card className="mb-6 border-primary/20 bg-primary/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Sparkles className="h-4 w-4 text-primary" />{" "}
                          Recommended for {selectedRole.replace("-", " ")}s
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {recommendedTools.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => addToStack(t)}
                              className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-left transition-all hover:border-primary hover:bg-primary/5"
                            >
                              <ToolLogo tool={t} size={8} />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {t.name}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {t.category}
                                </p>
                              </div>
                              <Plus className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                      <Button
                        variant={
                          selectedCategory === null ? "secondary" : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                      >
                        All
                      </Button>
                      {initialCategories.slice(0, 5).map((c) => (
                        <Button
                          key={c.id}
                          variant={
                            selectedCategory === c.id ? "secondary" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedCategory(c.id)}
                          className="whitespace-nowrap"
                        >
                          {c.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredTools.map((t) => (
                      <Card
                        key={t.id}
                        className="group cursor-pointer transition-all hover:border-primary hover:shadow-md"
                        onClick={() => addToStack(t)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <ToolLogo tool={t} size={10} />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">{t.name}</p>
                              <p className="line-clamp-1 text-sm text-muted-foreground">
                                {t.shortDescription}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs capitalize text-muted-foreground">
                                  {t.category}
                                </span>
                                {t.pricing.hasFree && (
                                  <ToolBadge badge="free" size="sm" />
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {filteredTools.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground">
                        No more tools to add.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Stack preview */}
                <div className="lg:w-96 shrink-0">
                  <div className="lg:sticky lg:top-24">
                    <Card>
                      <CardHeader className="border-b border-border">
                        <div className="flex items-center justify-between">
                          {isEditingName ? (
                            <Input
                              value={stackName}
                              onChange={(e) => setStackName(e.target.value)}
                              onBlur={() => setIsEditingName(false)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && setIsEditingName(false)
                              }
                              className="text-lg font-semibold"
                              autoFocus
                            />
                          ) : (
                            <CardTitle
                              className="cursor-pointer hover:text-primary transition-colors"
                              onClick={() => setIsEditingName(true)}
                            >
                              {stackName}
                            </CardTitle>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingName(!isEditingName)}
                          >
                            Edit
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        {stackTools.length > 0 ? (
                          <div className="space-y-2">
                            {stackTools.map((t, i) => (
                              <div
                                key={t.id}
                                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3"
                              >
                                <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                                  {i + 1}
                                </span>
                                <ToolLogo tool={t} size={8} />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">
                                    {t.name}
                                  </p>
                                  <p className="text-xs capitalize text-muted-foreground">
                                    {t.category}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => moveToolUp(i)}
                                    disabled={i === 0}
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => moveToolDown(i)}
                                    disabled={i === stackTools.length - 1}
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => removeFromStack(t.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                              <Layers className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground">
                              Your stack is empty. Add tools from the left
                              panel.
                            </p>
                          </div>
                        )}

                        {stackTools.length > 0 && (
                          <div className="mt-4 space-y-2 border-t border-border pt-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <Layers className="h-4 w-4" />
                                Tools
                              </span>
                              <span className="font-medium">
                                {stackStats.toolCount}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <Sparkles className="h-4 w-4" />
                                Categories
                              </span>
                              <span className="font-medium">
                                {stackStats.categoryCount}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                Est. Cost
                              </span>
                              <span className="font-medium">
                                ~${stackStats.estimatedCost}/mo
                              </span>
                            </div>
                            {stackStats.hasFreeTier && (
                              <div className="flex items-center gap-2 text-sm text-success">
                                <CheckCircle className="h-4 w-4" />
                                Some tools have free tiers
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-6 space-y-2">
                          <Button
                            className="w-full"
                            disabled={stackTools.length === 0 || isSaving}
                            onClick={saveStack}
                          >
                            {isSaving ? (
                              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            {user ? "Save Stack" : "Sign in to Save"}
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              disabled={stackTools.length === 0}
                              onClick={exportStack}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </Button>
                            <Button
                              variant="outline"
                              disabled={stackTools.length === 0}
                            >
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                            </Button>
                          </div>
                          {stackTools.length > 0 && (
                            <Button
                              variant="ghost"
                              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setStackTools([])}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Clear Stack
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="mt-4">
                      <CardContent className="p-4">
                        <p className="mb-3 text-sm text-muted-foreground">
                          Need inspiration? Browse pre-built stacks.
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/stacks">
                            Browse Stacks
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
