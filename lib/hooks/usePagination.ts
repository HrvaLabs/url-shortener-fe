"use client"

import { useState, useCallback, useEffect } from "react"

const DEFAULT_SIZE = 20

export function useClampedPage(page: number, totalPages: number | undefined, setPage: (page: number) => void) {
  useEffect(() => {
    if (totalPages != null && totalPages > 0 && page >= totalPages) setPage(totalPages - 1)
  }, [page, totalPages, setPage])
}

const addressParam = (name: string) => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(name))

const knownSort = (sort: string | null, sortFields: readonly string[] | undefined) => sort != null && (sortFields == null || sortFields.includes(sort))

type SortOrder = "asc" | "desc"

/** The order after a click on a sort header: a new field starts at `firstDirection` (ascending unless given), the current field flips. */
export const nextSortOrder = (sort: string, order: SortOrder, field: string, firstDirection: SortOrder = "asc"): SortOrder =>
  sort === field ? (order === "asc" ? "desc" : "asc") : firstDirection

export const prefixedParam = (prefix: string, name: string) => (prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name)

export function usePagination(defaultSort = "createDate", defaultOrder: "asc" | "desc" = "desc", sortFields?: readonly string[], prefix = "") {
  const pageName = prefixedParam(prefix, "page")
  const sizeName = prefixedParam(prefix, "size")
  const sortName = prefixedParam(prefix, "sort")
  const orderName = prefixedParam(prefix, "order")
  const [page, setPageState] = useState(() => Math.max(0, parseInt(addressParam(pageName) ?? "0", 10) || 0))
  const [size, setSizeState] = useState(() => parseInt(addressParam(sizeName) ?? String(DEFAULT_SIZE), 10) || DEFAULT_SIZE)
  const [sort, setSortState] = useState(() => {
    const addressSort = addressParam(sortName)
    return knownSort(addressSort, sortFields) ? (addressSort as string) : defaultSort
  })
  const [order, setOrderState] = useState<"asc" | "desc">(() => {
    const addressOrder = addressParam(orderName)
    if (!knownSort(addressParam(sortName), sortFields)) return defaultOrder
    return addressOrder === "asc" || addressOrder === "desc" ? addressOrder : defaultOrder
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set(pageName, String(page))
    params.set(sizeName, String(size))
    if (sort) {
      params.set(sortName, sort)
      params.set(orderName, order)
    } else {
      params.delete(sortName)
      params.delete(orderName)
    }
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`)
  }, [pageName, sizeName, sortName, orderName, page, size, sort, order])

  const setPage = useCallback((p: number) => {
    setPageState(Math.max(0, p))
  }, [])

  const setSize = useCallback((s: number) => {
    setSizeState(s)
    setPageState(0)
  }, [])

  const toggleSort = useCallback(
    (field: string, firstDirection: SortOrder = "asc") => {
      setSortState(field)
      setOrderState(nextSortOrder(sort, order, field, firstDirection))
      setPageState(0)
    },
    [sort, order],
  )

  const setSortOrder = useCallback((field: string, direction: "asc" | "desc") => {
    setSortState(field)
    setOrderState(direction)
    setPageState(0)
  }, [])

  const sortDir = useCallback(
    (field: string) => (sort === field ? order : null),
    [sort, order],
  )

  return { page, size, sort, order, setPage, setSize, toggleSort, setSortOrder, sortDir }
}
