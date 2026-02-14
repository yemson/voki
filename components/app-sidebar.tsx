"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpenText,
  CircleUserRound,
  Plus,
  Settings,
} from "lucide-react";

import { logout } from "@/app/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarGroupContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarContent,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-10 text-base font-semibold">
              <Link href="/dashboard">
                <BarChart3 className="size-4" />
                Voki
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="새 거래"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                >
                  <Link href="/trades/new">
                    <Plus />
                    <span>새 거래 작성</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="대시보드">
                  <Link href="/dashboard">
                    <BarChart3 />
                    <span>대시보드</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="트레이드 리스트">
                  <Link href="/dashboard#trades-list">
                    <BookOpenText />
                    <span>트레이드 리스트</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="설정">
                  <Settings />
                  <span>설정</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="mb-2 flex items-center gap-2 rounded-lg border p-2">
          <Avatar className="size-8">
            <AvatarFallback>
              <CircleUserRound className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-xs text-muted-foreground">
            꾸준한 기록이
            <br />
            좋은 의사결정을 만듭니다.
          </div>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" className="w-full">
            로그아웃
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
