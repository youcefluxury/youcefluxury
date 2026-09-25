import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

import { HaMonogram } from "@/components/store/bits";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const { t, isAr } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center"
    >
      <HaMonogram className="size-12 text-foreground" />
      <p className="font-display mt-8 text-6xl tracking-[0.2em]">404</p>
      <h1 className="mt-4 text-xl font-semibold">{t("notFound.title")}</h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-7">
        {t("notFound.body")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild className="h-11 px-6">
          <Link to="/shop">
            {t("notFound.shop")}
            <ArrowLeft className={cn("size-4", !isAr && "rotate-180")} />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 px-6">
          <Link to="/">{t("notFound.home")}</Link>
        </Button>
      </div>
    </motion.div>
  );
}
